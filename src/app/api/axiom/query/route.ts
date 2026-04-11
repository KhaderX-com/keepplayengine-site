import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
    getEventsByType,
    getSessionCount,
    getAdEventsSummary,
    getErrorsSummary,
    getEventsOverTime,
    getTopCountries,
    getGameSideReportsSummary,
    getRecentEvents,
    getFraudServerSideRevenue,
    getFraudGameSideRevenue,
    getFraudIntegrityFailures,
    getFraudHighFrequency,
    getFraudRevenueTotals,
    getFraudGameRevenueTotals,
    getFraudServerNonces,
    getFraudGameNonces,
    getFraudRecentSuspicious,
    getFraudDuplicateNonces,
    getFraudRevenuePatterns,
    getFraudDeviceFingerprints,
    getFraudHourlyHeatmap,
    getFraudNightOwlUsers,
    getFraudWithdrawalVelocity,
    getFraudIntegritySummary,
    getFraudIntegrityByUser,
} from "@/lib/axiom";

const ALLOWED_QUERIES = [
    "events-by-type",
    "session-count",
    "ad-events-summary",
    "errors-summary",
    "events-over-time",
    "top-countries",
    "game-side-reports",
    "recent-events",
    "fraud-server-revenue",
    "fraud-game-revenue",
    "fraud-integrity-failures",
    "fraud-high-frequency",
    "fraud-revenue-totals",
    "fraud-game-revenue-totals",
    "fraud-server-nonces",
    "fraud-game-nonces",
    "fraud-recent-suspicious",
    "fraud-duplicate-nonces",
    "fraud-revenue-patterns",
    "fraud-device-fingerprints",
    "fraud-hourly-heatmap",
    "fraud-night-owl-users",
    "fraud-withdrawal-velocity",
    "fraud-integrity-summary",
    "fraud-integrity-by-user",
] as const;

type QueryName = (typeof ALLOWED_QUERIES)[number];

export async function GET(request: NextRequest) {
    // Auth check — admin only
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const role = session.user.role;
    if (!role || !["SUPER_ADMIN", "ADMIN"].includes(role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") as QueryName | null;
    const startTime = searchParams.get("startTime") || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const endTime = searchParams.get("endTime") || new Date().toISOString();

    if (!query || !ALLOWED_QUERIES.includes(query)) {
        return NextResponse.json(
            { error: `Invalid query. Allowed: ${ALLOWED_QUERIES.join(", ")}` },
            { status: 400 },
        );
    }

    try {
        let data;
        switch (query) {
            case "events-by-type":
                data = await getEventsByType(startTime, endTime);
                break;
            case "session-count":
                data = await getSessionCount(startTime, endTime);
                break;
            case "ad-events-summary":
                data = await getAdEventsSummary(startTime, endTime);
                break;
            case "errors-summary":
                data = await getErrorsSummary(startTime, endTime);
                break;
            case "events-over-time":
                data = await getEventsOverTime(startTime, endTime);
                break;
            case "top-countries":
                data = await getTopCountries(startTime, endTime);
                break;
            case "game-side-reports":
                data = await getGameSideReportsSummary(startTime, endTime);
                break;
            case "recent-events":
                data = await getRecentEvents(startTime, endTime);
                break;
            case "fraud-server-revenue":
                data = await getFraudServerSideRevenue(startTime, endTime);
                break;
            case "fraud-game-revenue":
                data = await getFraudGameSideRevenue(startTime, endTime);
                break;
            case "fraud-integrity-failures":
                data = await getFraudIntegrityFailures(startTime, endTime);
                break;
            case "fraud-high-frequency":
                data = await getFraudHighFrequency(startTime, endTime);
                break;
            case "fraud-revenue-totals":
                data = await getFraudRevenueTotals(startTime, endTime);
                break;
            case "fraud-game-revenue-totals":
                data = await getFraudGameRevenueTotals(startTime, endTime);
                break;
            case "fraud-server-nonces":
                data = await getFraudServerNonces(startTime, endTime);
                break;
            case "fraud-game-nonces":
                data = await getFraudGameNonces(startTime, endTime);
                break;
            case "fraud-recent-suspicious":
                data = await getFraudRecentSuspicious(startTime, endTime);
                break;
            case "fraud-duplicate-nonces":
                data = await getFraudDuplicateNonces(startTime, endTime);
                break;
            case "fraud-revenue-patterns":
                data = await getFraudRevenuePatterns(startTime, endTime);
                break;
            case "fraud-device-fingerprints":
                data = await getFraudDeviceFingerprints(startTime, endTime);
                break;
            case "fraud-hourly-heatmap":
                data = await getFraudHourlyHeatmap(startTime, endTime);
                break;
            case "fraud-night-owl-users":
                data = await getFraudNightOwlUsers(startTime, endTime);
                break;
            case "fraud-withdrawal-velocity":
                data = await getFraudWithdrawalVelocity(startTime, endTime);
                break;
            case "fraud-integrity-summary":
                data = await getFraudIntegritySummary(startTime, endTime);
                break;
            case "fraud-integrity-by-user":
                data = await getFraudIntegrityByUser(startTime, endTime);
                break;
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error("Axiom query error:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
