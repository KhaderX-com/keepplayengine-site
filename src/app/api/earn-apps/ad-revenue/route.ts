import { NextRequest, NextResponse } from "next/server";
import { createKpeiApiHandler } from "@/lib/kpei-gateway";
import { EarnAppsUsersDAL, EarnAppsWithdrawalsDAL } from "@/lib/earn-apps-dal";
import {
    getEarnAppsEventsByName,
    getEarnAppsEventsOverTime,
    getEarnAppsRecentEvents,
    getEarnAppsRevenueByApp,
    getEarnAppsRevenueSummary,
} from "@/lib/axiom";

export const GET = createKpeiApiHandler(
    {
        auditResource: "earn-apps:ad-revenue",
        auditAction: "view",
        requiredRoles: ["SUPER_ADMIN", "ADMIN"],
    },
    async (request: NextRequest, context) => {
        const { searchParams } = request.nextUrl;
        const now = new Date();
        const startTime = searchParams.get("startTime")
            || new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const endTime = searchParams.get("endTime") || now.toISOString();

        const [
            usersStats,
            withdrawalsStats,
            revenueSummary,
            revenueByApp,
            eventsOverTime,
            eventsByName,
            recentEvents,
        ] = await Promise.all([
            EarnAppsUsersDAL.stats(context.kpei),
            EarnAppsWithdrawalsDAL.stats(context.kpei),
            getEarnAppsRevenueSummary(startTime, endTime).catch(() => null),
            getEarnAppsRevenueByApp(startTime, endTime).catch(() => null),
            getEarnAppsEventsOverTime(startTime, endTime).catch(() => null),
            getEarnAppsEventsByName(startTime, endTime).catch(() => null),
            getEarnAppsRecentEvents(startTime, endTime).catch(() => null),
        ]);

        if (usersStats.error || withdrawalsStats.error) {
            return NextResponse.json({ error: "Failed to fetch Earn Apps economy stats" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            economy: {
                users: usersStats.data,
                withdrawals: withdrawalsStats.data,
            },
            axiom: {
                revenueSummary: revenueSummary?.tables?.[0] ?? null,
                revenueByApp: revenueByApp?.tables?.[0] ?? null,
                eventsOverTime: eventsOverTime?.tables?.[0] ?? null,
                eventsByName: eventsByName?.tables?.[0] ?? null,
                recentEvents: recentEvents?.tables?.[0] ?? null,
            },
            timeRange: { startTime, endTime },
        });
    },
);
