/**
 * KPE Dashboard Stats API Route
 *
 * GET /api/kpe/stats
 * Returns high-level dashboard statistics from the KeepPlay Engine.
 */

import { NextResponse } from "next/server";
import { createKpeApiHandler } from "@/lib/kpe-gateway";
import { KpeStatsDAL } from "@/lib/kpe-dal";

export const GET = createKpeApiHandler(
    {
        auditResource: "kpe:stats",
        auditAction: "get_dashboard_stats",
        requiredRoles: ["SUPER_ADMIN", "ADMIN", "MODERATOR"],
    },
    async (_request, context) => {
        const { data, error } = await KpeStatsDAL.getDashboardStats(context.kpe);

        if (error) {
            return NextResponse.json(
                { error: "Failed to fetch KPE stats" },
                { status: 500 },
            );
        }

        return NextResponse.json(data);
    },
);
