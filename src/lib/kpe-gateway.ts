/**
 * KeepPlay Engine API Gateway
 *
 * Secure bridge between the admin panel and the KPE database.
 * Every call through this gateway is:
 *   1. Authenticated (admin session required)
 *   2. Authorized (role check)
 *   3. Audited (full trail in KPE admin_audit_log)
 *   4. Server-side only
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
    /** @deprecated Rate limiting has been removed for admin panel */
    rateLimit?: { limit: number; windowMs: number };
    /** Resource type for audit logging (e.g., "kpe:users", "kpe:wallets") */
    auditResource: string;
    /** Action name for audit logging (e.g., "list", "get_detail", "update_status") */
    auditAction: string;
    /** Severity level for audit logging */
    auditSeverity?: "info" | "warning" | "critical";
};

// ─────────────────────────────────────────────
// KPE Rate Limiting — DISABLED
// Rate limiting was causing 429 errors for legitimate admin
// usage. The admin panel is a private, authenticated surface.
// ─────────────────────────────────────────────

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
    const requiredRoles = options.requiredRoles ?? ["SUPER_ADMIN", "ADMIN"];

    return createApiHandler<T>(
        {
            bodySchema: options.bodySchema,
            requiredRoles,
        },
        async (request, gatewayContext) => {
            const startTime = Date.now();
            const { session, ip, userAgent } = gatewayContext;

            // ── KPE rate limiting — DISABLED ──

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
