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

type AxiomLoadResult<T> = {
    data: T | null;
    error: string | null;
};

async function loadAxiom<T>(loader: () => Promise<T>): Promise<AxiomLoadResult<T>> {
    try {
        return { data: await loader(), error: null };
    } catch (error) {
        return {
            data: null,
            error: error instanceof Error ? error.message : "Unknown Axiom error",
        };
    }
}

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
            loadAxiom(() => getEarnAppsRevenueSummary(startTime, endTime)),
            loadAxiom(() => getEarnAppsRevenueByApp(startTime, endTime)),
            loadAxiom(() => getEarnAppsEventsOverTime(startTime, endTime)),
            loadAxiom(() => getEarnAppsEventsByName(startTime, endTime)),
            loadAxiom(() => getEarnAppsRecentEvents(startTime, endTime)),
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
                revenueSummary: revenueSummary.data?.tables?.[0] ?? null,
                revenueByApp: revenueByApp.data?.tables?.[0] ?? null,
                eventsOverTime: eventsOverTime.data?.tables?.[0] ?? null,
                eventsByName: eventsByName.data?.tables?.[0] ?? null,
                recentEvents: recentEvents.data?.tables?.[0] ?? null,
            },
            axiomErrors: {
                revenueSummary: revenueSummary.error,
                revenueByApp: revenueByApp.error,
                eventsOverTime: eventsOverTime.error,
                eventsByName: eventsByName.error,
                recentEvents: recentEvents.error,
            },
            timeRange: { startTime, endTime },
        });
    },
);
