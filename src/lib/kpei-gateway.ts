/**
 * KPEI (KPE Infrastructure) API Gateway
 *
 * Secure bridge between the admin panel and the KPEI database.
 * Same pattern as kpe-gateway.ts but for the new infrastructure project.
 */

import { NextRequest, NextResponse } from "next/server";
import { kpeiAdmin } from "@/lib/supabase-kpei";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { GatewayContext } from "@/lib/api-gateway";
import { createApiHandler } from "@/lib/api-gateway";
import type { AdminRole } from "@/lib/api-gateway";
import { z } from "zod";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface KpeiGatewayContext<T = unknown> extends GatewayContext<T> {
    kpei: SupabaseClient;
}

type KpeiGatewayOptions<T> = {
    bodySchema?: z.ZodSchema<T>;
    requiredRoles?: AdminRole[];
    auditResource: string;
    auditAction: string;
    auditSeverity?: "info" | "warning" | "critical";
};

// ─────────────────────────────────────────────
// The KPEI Gateway Wrapper
// ─────────────────────────────────────────────

export function createKpeiApiHandler<T = unknown>(
    options: KpeiGatewayOptions<T>,
    handler: (
        request: NextRequest,
        context: KpeiGatewayContext<T>,
    ) => Promise<NextResponse>,
) {
    const requiredRoles = options.requiredRoles ?? ["SUPER_ADMIN", "ADMIN"];

    return createApiHandler<T>(
        {
            bodySchema: options.bodySchema,
            requiredRoles,
        },
        async (request, gatewayContext) => {
            try {
                const kpeiContext: KpeiGatewayContext<T> = {
                    ...gatewayContext,
                    kpei: kpeiAdmin,
                };

                return await handler(request, kpeiContext);
            } catch (err) {
                if (process.env.NODE_ENV !== "production") {
                    console.error("[KPEI Gateway]", err);
                }

                return NextResponse.json(
                    { error: "Internal server error" },
                    { status: 500 },
                );
            }
        },
    );
}
