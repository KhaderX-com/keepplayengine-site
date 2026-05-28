import { NextRequest, NextResponse } from "next/server";
import { createKpeiApiHandler } from "@/lib/kpei-gateway";
import { EarnAppsUsersDAL } from "@/lib/earn-apps-dal";

export const GET = createKpeiApiHandler(
    {
        auditResource: "earn-apps:users",
        auditAction: "list",
        requiredRoles: ["SUPER_ADMIN", "ADMIN"],
    },
    async (request: NextRequest, context) => {
        const { searchParams } = request.nextUrl;
        const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10) || 50, 100);
        const offset = parseInt(searchParams.get("offset") ?? "0", 10) || 0;

        const [{ data, error, count }, stats] = await Promise.all([
            EarnAppsUsersDAL.list(context.kpei, {
                limit,
                offset,
                search: searchParams.get("search") ?? undefined,
                appId: searchParams.get("app_id") ?? undefined,
                status: searchParams.get("status") ?? undefined,
                sortBy: searchParams.get("sort_by") ?? "created_at",
                sortOrder: searchParams.get("sort_order") ?? "desc",
            }),
            EarnAppsUsersDAL.stats(context.kpei),
        ]);

        if (error || stats.error) {
            return NextResponse.json({ error: "Failed to fetch Earn Apps users" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            users: data ?? [],
            total: count ?? 0,
            limit,
            offset,
            stats: stats.data,
        });
    },
);
