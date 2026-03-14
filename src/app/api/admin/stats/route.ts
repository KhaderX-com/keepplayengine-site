import { NextResponse } from "next/server";
import { createApiHandler } from "@/lib/api-gateway";
import { AdminDAL, getUserClient } from "@/lib/dal";

/**
 * Admin Statistics API — uses get_admin_dashboard_stats() RPC
 * Single database round-trip instead of 9 parallel queries
 */
export const GET = createApiHandler(
    { requiredRoles: ["SUPER_ADMIN"] },
    async (_request, { session }) => {
        const client = await getUserClient(session.user.id, session.user.role);
        const { data, error } = await AdminDAL.getDashboardStats(client);

        if (error) {
            console.error("Error fetching admin stats:", error);
            return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
        }

        return NextResponse.json(data);
    },
);
