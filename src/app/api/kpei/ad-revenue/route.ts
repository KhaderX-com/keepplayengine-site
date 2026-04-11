import { NextRequest, NextResponse } from "next/server";
import { createKpeiApiHandler } from "@/lib/kpei-gateway";
import { KpeiEconomyDAL } from "@/lib/kpei-dal";
import { getAdEventsSummary, getSessionCount, getEventsOverTime, getTopCountries } from "@/lib/axiom";

/**
 * GET /api/kpei/ad-revenue
 *
 * Aggregates economy data from KPEI Supabase + Axiom ad-event logs.
 * Query params: startTime, endTime (ISO strings, default last 7d)
 */
export const GET = createKpeiApiHandler(
    {
        auditResource: "kpei-ad-revenue",
        auditAction: "view",
    },
    async (request: NextRequest, context) => {
        const { searchParams } = new URL(request.url);
        const now = new Date();
        const startTime = searchParams.get("startTime") || new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const endTime = searchParams.get("endTime") || now.toISOString();

        // Fetch all data in parallel
        const [walletRes, challengeRes, withdrawalRes, adSummary, sessionData, eventsOverTime, topCountries] =
            await Promise.all([
                KpeiEconomyDAL.getWalletStats(context.kpei),
                KpeiEconomyDAL.getChallengeStats(context.kpei),
                KpeiEconomyDAL.getWithdrawalEconomyStats(context.kpei),
                getAdEventsSummary(startTime, endTime).catch(() => null),
                getSessionCount(startTime, endTime).catch(() => null),
                getEventsOverTime(startTime, endTime).catch(() => null),
                getTopCountries(startTime, endTime).catch(() => null),
            ]);

        return NextResponse.json({
            success: true,
            economy: {
                wallets: walletRes.data,
                challenges: challengeRes.data,
                withdrawals: withdrawalRes.data,
            },
            axiom: {
                adSummary: adSummary?.tables?.[0] ?? null,
                sessions: sessionData?.tables?.[0] ?? null,
                eventsOverTime: eventsOverTime?.tables?.[0] ?? null,
                topCountries: topCountries?.tables?.[0] ?? null,
            },
            timeRange: { startTime, endTime },
        });
    },
);
