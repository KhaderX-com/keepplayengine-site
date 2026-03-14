import { NextRequest, NextResponse } from "next/server";
import { AdminDAL, getUserClient } from "@/lib/dal";
import { timingSafeEqual } from "crypto";

/** Constant-time comparison for secret tokens */
function safeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/**
 * GET /api/cron/cleanup-sessions
 * Automated cleanup of expired admin sessions.
 * Called by Vercel Cron (daily at 3 AM UTC).
 */
export async function GET(request: NextRequest) {
    // Verify cron secret (Vercel sends this header for cron jobs)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || !authHeader || !safeCompare(authHeader, `Bearer ${cronSecret}`)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await getUserClient("00000000-0000-0000-0000-000000000000", "SUPER_ADMIN");

    const { error, count } = await AdminDAL.deleteExpiredSessions(client);

    if (error) {
        console.error(JSON.stringify({
            level: "error",
            service: "cron/cleanup-sessions",
            operation: "deleteExpiredSessions",
            timestamp: new Date().toISOString(),
            error: error.message,
            code: error.code,
        }));
        return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
    }

    const deletedCount = count ?? 0;
    console.log(JSON.stringify({
        level: "info",
        service: "cron/cleanup-sessions",
        operation: "deleteExpiredSessions",
        timestamp: new Date().toISOString(),
        deletedCount,
    }));

    return NextResponse.json({
        success: true,
        deletedCount,
    });
}
