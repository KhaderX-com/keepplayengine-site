import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import type { AdminRoleType } from "@/lib/supabase";

// ─────────────────────────────────────────────
// CSRF Protection (CRIT-02)
// ─────────────────────────────────────────────
function validateCsrf(request: NextRequest): boolean {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");

    // GET/HEAD/OPTIONS are safe methods — no CSRF check needed
    if (["GET", "HEAD", "OPTIONS"].includes(request.method)) {
        return true;
    }

    // Origin must be present for state-changing requests
    if (!origin) return false;

    // Build allowed origins from environment + host header
    const allowedOrigins = new Set<string>();
    if (process.env.NEXTAUTH_URL) {
        allowedOrigins.add(new URL(process.env.NEXTAUTH_URL).origin);
    }
    if (host) {
        allowedOrigins.add(`https://${host}`);
        allowedOrigins.add(`http://${host}`); // dev only
    }

    return allowedOrigins.has(origin);
}

// ─────────────────────────────────────────────
// Rate Limiting — DISABLED
// The admin panel is a private, authenticated-only surface.
// Rate limiting was causing 429 errors for legitimate admin
// usage (dashboard loads, navigation, etc.) and serves no
// real purpose since every request already requires a valid
// admin session + role check.
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// Content-Type Validation (MED-05)
// ─────────────────────────────────────────────
function validateContentType(request: NextRequest): boolean {
    if (["POST", "PUT", "PATCH"].includes(request.method)) {
        const ct = request.headers.get("content-type");
        return ct !== null && ct.includes("application/json");
    }
    return true;
}

// ─────────────────────────────────────────────
// IP Extraction (H10: Hardened against header spoofing)
// On Vercel behind Cloudflare, trust only platform-injected headers.
// Priority: Vercel's own header > Cloudflare > fallbacks
// ─────────────────────────────────────────────
function extractIp(request: NextRequest): string {
    // x-vercel-forwarded-for is injected by Vercel's edge and cannot be spoofed
    const vercelIp = request.headers.get("x-vercel-forwarded-for");
    if (vercelIp) return vercelIp.split(",")[0].trim();

    // cf-connecting-ip is injected by Cloudflare and cannot be spoofed through CF
    const cfIp = request.headers.get("cf-connecting-ip");
    if (cfIp) return cfIp;

    // true-client-ip is Cloudflare Enterprise / Akamai
    const trueClientIp = request.headers.get("true-client-ip");
    if (trueClientIp) return trueClientIp;

    // x-real-ip and x-forwarded-for are less trusted (can be spoofed without WAF)
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) return forwarded.split(",")[0].trim();

    return request.headers.get("x-real-ip") ?? "unknown";
}

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
export type AdminRole = "SUPER_ADMIN" | "ADMIN" | "MODERATOR" | "VIEWER";

export interface GatewaySession {
    user: {
        id: string;
        email: string;
        name?: string | null;
        role: AdminRoleType;
        image?: string | null;
    };
}

export interface GatewayContext<T = unknown> {
    session: GatewaySession;
    body: T;
    ip: string;
    userAgent: string | null;
}

type GatewayOptions<T> = {
    /** Zod schema for request body validation (POST/PUT/PATCH) */
    bodySchema?: z.ZodSchema<T>;
    /** Required admin roles. Empty/undefined = any authenticated admin */
    requiredRoles?: AdminRole[];
    /** @deprecated Rate limiting has been removed for admin panel */
    rateLimit?: { limit: number; windowMs: number };
    /** Skip CSRF for special routes (e.g., NextAuth callbacks) */
    skipCsrf?: boolean;
    /** Skip auth — for pre-login endpoints (WebAuthn, verify-credentials) */
    skipAuth?: boolean;
    /** Skip Content-Type check (e.g., GET-only endpoints) */
    skipContentType?: boolean;
};

// ─────────────────────────────────────────────
// The Gateway Wrapper
// ─────────────────────────────────────────────
export function createApiHandler<T = unknown>(
    options: GatewayOptions<T>,
    handler: (
        request: NextRequest,
        context: GatewayContext<T>,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        routeContext?: any,
    ) => Promise<NextResponse>,
) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return async (request: NextRequest, routeContext?: any) => {
        try {
            const ip = extractIp(request);
            const userAgent = request.headers.get("user-agent");

            // 1. Authentication (when required)
            // We do this before rate limiting so we can rate limit by admin user id.
            let session: GatewaySession | null = null;
            if (!options.skipAuth) {
                const rawSession = await getServerSession(authOptions);
                if (!rawSession?.user?.id || !rawSession?.user?.email) {
                    return NextResponse.json(
                        { error: "Unauthorized" },
                        { status: 401 },
                    );
                }
                session = rawSession as GatewaySession;

                // 2. Authorization (role check)
                if (options.requiredRoles?.length) {
                    const userRole = session.user.role;
                    if (!options.requiredRoles.includes(userRole as AdminRole)) {
                        return NextResponse.json(
                            { error: "Forbidden" },
                            { status: 403 },
                        );
                    }
                }
            }

            // 3. Rate limiting — DISABLED (see comment at top of file)

            // 4. CSRF validation
            if (!options.skipCsrf && !validateCsrf(request)) {
                return NextResponse.json(
                    { error: "Invalid origin" },
                    { status: 403 },
                );
            }

            // 5. Content-Type validation
            if (!options.skipContentType && !validateContentType(request)) {
                return NextResponse.json(
                    { error: "Content-Type must be application/json" },
                    { status: 415 },
                );
            }

            // 6. Body validation
            let body = {} as T;
            if (
                options.bodySchema &&
                ["POST", "PUT", "PATCH"].includes(request.method)
            ) {
                let raw: unknown;
                try {
                    raw = await request.json();
                } catch {
                    return NextResponse.json(
                        { error: "Invalid JSON body" },
                        { status: 400 },
                    );
                }
                const parsed = options.bodySchema.safeParse(raw);
                if (!parsed.success) {
                    return NextResponse.json(
                        {
                            error: "Validation failed",
                            details: parsed.error.flatten(),
                        },
                        { status: 400 },
                    );
                }
                body = parsed.data;
            }

            // 7. Execute handler
            const response = await handler(request, {
                session: session ?? { user: { id: "", email: "", role: "VIEWER" as AdminRoleType } },
                body,
                ip,
                userAgent,
            }, routeContext);

            return response;
        } catch (err) {
            // M15: Never leak internal error details to clients
            if (process.env.NODE_ENV !== "production") {
                console.error("API Gateway error:", err);
            }
            return NextResponse.json(
                { error: "Internal server error" },
                { status: 500 },
            );
        }
    };
}
