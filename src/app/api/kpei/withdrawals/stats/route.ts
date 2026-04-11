/**
 * KPEI Withdrawal Stats API
 *
 * GET /api/kpei/withdrawals/stats
 */

import { NextRequest, NextResponse } from "next/server";
import { createKpeiApiHandler } from "@/lib/kpei-gateway";
import { KpeiWithdrawalsDAL } from "@/lib/kpei-dal";

export const GET = createKpeiApiHandler(
    {
        auditResource: "kpei:withdrawals",
        auditAction: "stats",
        requiredRoles: ["SUPER_ADMIN", "ADMIN"],
    },
    async (_request: NextRequest, context) => {
        const { data, error } = await KpeiWithdrawalsDAL.getStats(context.kpei);

        if (error) {
            return NextResponse.json(
                { error: "Failed to fetch withdrawal stats" },
                { status: 500 },
            );
        }

        return NextResponse.json(data);
    },
);
