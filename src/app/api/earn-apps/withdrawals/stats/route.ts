import { NextResponse } from "next/server";
import { createKpeiApiHandler } from "@/lib/kpei-gateway";
import { EarnAppsWithdrawalsDAL } from "@/lib/earn-apps-dal";

export const GET = createKpeiApiHandler(
    {
        auditResource: "earn-apps:withdrawals",
        auditAction: "stats",
        requiredRoles: ["SUPER_ADMIN", "ADMIN"],
    },
    async (_request, context) => {
        const { data, error } = await EarnAppsWithdrawalsDAL.stats(context.kpei);
        if (error) {
            return NextResponse.json({ error: "Failed to fetch withdrawal stats" }, { status: 500 });
        }

        return NextResponse.json({ success: true, stats: data });
    },
);
