/**
 * KPEI Withdrawals API Routes
 *
 * GET  /api/kpei/withdrawals — Paginated list with filters
 * PATCH /api/kpei/withdrawals — Approve or deny a withdrawal
 */

import { NextRequest, NextResponse } from "next/server";
import { createKpeiApiHandler } from "@/lib/kpei-gateway";
import { KpeiWithdrawalsDAL } from "@/lib/kpei-dal";
import { z } from "zod";

export const GET = createKpeiApiHandler(
    {
        auditResource: "kpei:withdrawals",
        auditAction: "list",
        requiredRoles: ["SUPER_ADMIN", "ADMIN"],
    },
    async (request: NextRequest, context) => {
        const { searchParams } = request.nextUrl;

        const limit = Math.min(
            parseInt(searchParams.get("limit") ?? "50", 10) || 50,
            100,
        );
        const offset = parseInt(searchParams.get("offset") ?? "0", 10) || 0;
        const status = searchParams.get("status") ?? undefined;
        const method = searchParams.get("method") ?? undefined;
        const userId = searchParams.get("user_id") ?? undefined;
        const search = searchParams.get("search") ?? undefined;

        const { data, error, count } = await KpeiWithdrawalsDAL.list(context.kpei, {
            limit,
            offset,
            status,
            method,
            userId,
            search,
        });

        if (error) {
            return NextResponse.json(
                { error: "Failed to fetch withdrawals" },
                { status: 500 },
            );
        }

        return NextResponse.json({
            success: true,
            withdrawals: data,
            total: count ?? 0,
            limit,
            offset,
        });
    },
);

// ─────────────────────────────────────────────
// PATCH — Approve or Deny a withdrawal
// ─────────────────────────────────────────────

const patchSchema = z.object({
    withdrawal_id: z.string().uuid(),
    new_status: z.enum(["approved", "paid", "denied"]),
    denial_reason: z.string().max(500).optional(),
    refund: z.boolean().optional(),
});

export const PATCH = createKpeiApiHandler(
    {
        auditResource: "kpei:withdrawals",
        auditAction: "update_status",
        auditSeverity: "critical",
        requiredRoles: ["SUPER_ADMIN", "ADMIN"],
        bodySchema: patchSchema,
    },
    async (_request: NextRequest, context) => {
        const body = context.body as z.infer<typeof patchSchema>;

        const { data, error } = await KpeiWithdrawalsDAL.updateStatus(
            context.kpei,
            body.withdrawal_id,
            body.new_status,
            body.denial_reason,
            body.refund,
        );

        if (error) {
            return NextResponse.json(
                { error: "Failed to update withdrawal status" },
                { status: 500 },
            );
        }

        const result = data as { success: boolean; error?: string };
        if (!result.success) {
            return NextResponse.json(
                { error: result.error ?? "Operation failed" },
                { status: 400 },
            );
        }

        return NextResponse.json(result);
    },
);
