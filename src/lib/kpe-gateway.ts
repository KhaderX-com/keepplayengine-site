/**
 * KeepPlay Engine API Gateway
 *
 * Secure bridge between the admin panel and the KPE database.
 * Every call through this gateway is:
 *   1. Authenticated (admin session required)
 *   2. Authorized (role check)
 *   3. Rate limited (per-admin, per-endpoint)
 *   4. Audited (full trail in KPE admin_audit_log)
 *   5. Server-side only
 *
 * This wraps createApiHandler from the main gateway with KPE-specific
 * audit logging and provides the KPE Supabase client to handlers.
 */

import { NextRequest, NextResponse } from "next/server";
import { kpeAdmin } from "@/lib/supabase-kpe";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { GatewayContext } from "@/lib/api-gateway";
import { createApiHandler } from "@/lib/api-gateway";
import type { AdminRole } from "@/lib/api-gateway";
import { z } from "zod";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface KpeGatewayContext<T = unknown> extends GatewayContext<T> {
    /** The KPE Supabase client (service_role, server-side only) */
    kpe: SupabaseClient;
}

type KpeGatewayOptions<T> = {
    /** Zod schema for request body validation */
    bodySchema?: z.ZodSchema<T>;
    /** Required admin roles. Default: SUPER_ADMIN and ADMIN only */
    requiredRoles?: AdminRole[];
    /** Rate limit overrides (defaults: 30 req / 60s — tighter than main gateway) */
    rateLimit?: { limit: number; windowMs: number };
    /** Resource type for audit logging (e.g., "kpe:users", "kpe:wallets") */
    auditResource: string;
    /** Action name for audit logging (e.g., "list", "get_detail", "update_status") */
    auditAction: string;
    /** Severity level for audit logging */
    auditSeverity?: "info" | "warning" | "critical";
};

// ─────────────────────────────────────────────
// KPE Rate Limiting (distributed via KPE DB)
// ─────────────────────────────────────────────

async function checkKpeRateLimit(
    adminId: string,
    endpoint: string,
    limit: number,
    windowSeconds: number,
): Promise<{ allowed: boolean; remaining: number; retryAfter: number }> {
    try {
        const { data, error } = await kpeAdmin.rpc("check_admin_rate_limit", {
            p_key: `admin:${adminId}`,
            p_endpoint: endpoint,
            p_max_requests: limit,
            p_window_seconds: Math.floor(windowSeconds / 1000),
        });

        if (error || !data) {
            // Fail open for rate limiting (the main gateway already has its own rate limiter)
            return { allowed: true, remaining: limit, retryAfter: 0 };
        }

        const result = data as { allowed: boolean; remaining: number; retry_after: number };
        return {
            allowed: result.allowed,
            remaining: result.remaining,
            retryAfter: result.retry_after,
        };
    } catch {
        return { allowed: true, remaining: limit, retryAfter: 0 };
    }
}

// ─────────────────────────────────────────────
// KPE Audit Logging (non-blocking)
// ─────────────────────────────────────────────

function logKpeAudit(params: {
    adminUserId: string;
    adminEmail: string;
    adminRole: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    description?: string;
    requestMetadata?: Record<string, unknown>;
    ipAddress: string;
    userAgent: string | null;
    severity: string;
    durationMs?: number;
    statusCode?: number;
    errorMessage?: string;
}): void {
    // Fire-and-forget (non-blocking)
    void (async () => {
        try {
            await kpeAdmin.rpc("log_admin_audit", {
                p_admin_user_id: params.adminUserId,
                p_admin_email: params.adminEmail,
                p_admin_role: params.adminRole,
                p_action: params.action,
                p_resource_type: params.resourceType,
                p_resource_id: params.resourceId,
                p_description: params.description,
                p_request_metadata: (params.requestMetadata ?? {}) as import("@/generated/kpe-database.types").Json,
                p_ip_address: params.ipAddress,
                p_user_agent: params.userAgent ?? undefined,
                p_severity: params.severity,
                p_duration_ms: params.durationMs,
                p_status_code: params.statusCode,
                p_error_message: params.errorMessage,
            });
        } catch (err: unknown) {
            if (process.env.NODE_ENV !== "production") {
                console.error("[KPE Audit] Failed to log:", err);
            }
        }
    })();
}

// ─────────────────────────────────────────────
// The KPE Gateway Wrapper
// ─────────────────────────────────────────────

/**
 * Creates an API route handler that wraps calls to the KPE backend
 * with full security: auth, role check, KPE rate limit, audit trail.
 *
 * Usage:
 * ```ts
 * export const GET = createKpeApiHandler(
 *   {
 *     auditResource: "kpe:users",
 *     auditAction: "list",
 *   },
 *   async (request, context) => {
 *     const { data } = await context.kpe.rpc("admin_list_users", { ... });
 *     return NextResponse.json(data);
 *   }
 * );
 * ```
 */
export function createKpeApiHandler<T = unknown>(
    options: KpeGatewayOptions<T>,
    handler: (
        request: NextRequest,
        context: KpeGatewayContext<T>,
    ) => Promise<NextResponse>,
) {
    // Default: only SUPER_ADMIN and ADMIN can access KPE data
    const requiredRoles = options.requiredRoles ?? ["SUPER_ADMIN", "ADMIN"];
    const rateLimit = options.rateLimit ?? { limit: 30, windowMs: 60_000 };

    return createApiHandler<T>(
        {
            bodySchema: options.bodySchema,
            requiredRoles,
            rateLimit,
        },
        async (request, gatewayContext) => {
            const startTime = Date.now();
            const { session, ip, userAgent } = gatewayContext;

            // ── KPE-specific rate limiting (per-admin, per-resource) ──
            // In development, skip the KPE DB rate limiter since the main
            // gateway already enforces per-IP rate limits and React Strict
            // Mode + HMR cause duplicated requests that drain the quota.
            const kpeRl =
                process.env.NODE_ENV === "development"
                    ? { allowed: true, remaining: rateLimit.limit, retryAfter: 0 }
                    : await checkKpeRateLimit(
                          session.user.id,
                          `kpe:${options.auditResource}:${options.auditAction}`,
                          rateLimit.limit,
                          rateLimit.windowMs,
                      );

            if (!kpeRl.allowed) {
                logKpeAudit({
                    adminUserId: session.user.id,
                    adminEmail: session.user.email,
                    adminRole: session.user.role,
                    action: options.auditAction,
                    resourceType: options.auditResource,
                    ipAddress: ip,
                    userAgent,
                    severity: "warning",
                    statusCode: 429,
                    description: "KPE rate limit exceeded",
                });

                const res = NextResponse.json(
                    { error: "Too many requests to KPE" },
                    { status: 429 },
                );
                res.headers.set("Retry-After", String(kpeRl.retryAfter));
                return res;
            }

            // ── Execute handler with KPE client ──
            try {
                const kpeContext: KpeGatewayContext<T> = {
                    ...gatewayContext,
                    kpe: kpeAdmin,
                };

                const response = await handler(request, kpeContext);
                const duration = Date.now() - startTime;

                // Audit successful call
                logKpeAudit({
                    adminUserId: session.user.id,
                    adminEmail: session.user.email,
                    adminRole: session.user.role,
                    action: options.auditAction,
                    resourceType: options.auditResource,
                    ipAddress: ip,
                    userAgent,
                    severity: options.auditSeverity ?? "info",
                    durationMs: duration,
                    statusCode: response.status,
                });

                // Add KPE rate limit header
                response.headers.set("X-KPE-RateLimit-Remaining", String(kpeRl.remaining));

                return response;
            } catch (err) {
                const duration = Date.now() - startTime;

                // Audit failed call
                logKpeAudit({
                    adminUserId: session.user.id,
                    adminEmail: session.user.email,
                    adminRole: session.user.role,
                    action: options.auditAction,
                    resourceType: options.auditResource,
                    ipAddress: ip,
                    userAgent,
                    severity: "critical",
                    durationMs: duration,
                    statusCode: 500,
                    errorMessage: err instanceof Error ? err.message : "Unknown error",
                });

                if (process.env.NODE_ENV !== "production") {
                    console.error("[KPE Gateway]", err);
                }

                return NextResponse.json(
                    { error: "Internal server error" },
                    { status: 500 },
                );
            }
        },
    );
}
