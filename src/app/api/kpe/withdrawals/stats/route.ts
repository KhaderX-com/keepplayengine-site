/**
 * KPE Withdrawal Stats API Route
 *
 * GET /api/kpe/withdrawals/stats
 * Returns aggregated withdrawal statistics for the admin dashboard.
 */

import { NextRequest, NextResponse } from "next/server";
import { createKpeApiHandler } from "@/lib/kpe-gateway";
import { KpeWithdrawalsDAL } from "@/lib/kpe-dal";

export const GET = createKpeApiHandler(
    {
        auditResource: "kpe:withdrawals",
        auditAction: "stats",
        requiredRoles: ["SUPER_ADMIN", "ADMIN"],
    },
    async (_request: NextRequest, context) => {
        const { data, error } = await KpeWithdrawalsDAL.getStats(context.kpe);

        if (error) {
            return NextResponse.json(
                { error: "Failed to fetch withdrawal stats" },
                { status: 500 },
            );
        }

        return NextResponse.json(data);
    },
);
