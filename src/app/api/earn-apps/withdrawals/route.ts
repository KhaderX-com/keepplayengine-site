import { NextRequest, NextResponse } from "next/server";
import { createKpeiApiHandler } from "@/lib/kpei-gateway";
import { EarnAppsWithdrawalsDAL } from "@/lib/earn-apps-dal";
import { z } from "zod";

export const GET = createKpeiApiHandler(
    {
        auditResource: "earn-apps:withdrawals",
        auditAction: "list",
        requiredRoles: ["SUPER_ADMIN", "ADMIN"],
    },
    async (request: NextRequest, context) => {
        const { searchParams } = request.nextUrl;
        const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10) || 50, 100);
        const offset = parseInt(searchParams.get("offset") ?? "0", 10) || 0;

        const { data, error, count } = await EarnAppsWithdrawalsDAL.list(context.kpei, {
            limit,
            offset,
            search: searchParams.get("search") ?? undefined,
            appId: searchParams.get("app_id") ?? undefined,
            status: searchParams.get("status") ?? undefined,
            method: searchParams.get("method") ?? undefined,
            sortBy: searchParams.get("sort_by") ?? "created_at",
            sortOrder: searchParams.get("sort_order") ?? "desc",
        });

        if (error) {
            return NextResponse.json({ error: "Failed to fetch Earn Apps withdrawals" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            withdrawals: data ?? [],
            total: count ?? 0,
            limit,
            offset,
        });
    },
);

const patchSchema = z.object({
    withdrawal_id: z.string().uuid(),
    status: z.enum(["pending", "processing", "approved", "paid", "completed", "denied", "rejected"]),
    admin_note: z.string().max(500).optional(),
});

export const PATCH = createKpeiApiHandler(
    {
        auditResource: "earn-apps:withdrawals",
        auditAction: "update_status",
        auditSeverity: "critical",
        requiredRoles: ["SUPER_ADMIN", "ADMIN"],
        bodySchema: patchSchema,
    },
    async (_request: NextRequest, context) => {
        const body = context.body as z.infer<typeof patchSchema>;
        const { data, error } = await EarnAppsWithdrawalsDAL.updateStatus(
            context.kpei,
            body.withdrawal_id,
            body.status,
            body.admin_note,
        );

        if (error) {
            return NextResponse.json({ error: "Failed to update withdrawal status" }, { status: 500 });
        }

        return NextResponse.json({ success: true, withdrawal: data });
    },
);
