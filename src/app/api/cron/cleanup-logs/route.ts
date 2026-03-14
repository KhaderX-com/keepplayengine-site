import { NextRequest, NextResponse } from "next/server";
import { AdminDAL, getUserClient } from "@/lib/dal";
import { timingSafeEqual } from "crypto";

/** Constant-time comparison for secret tokens */
function safeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/**
 * GET /api/cron/cleanup-logs
 * Automated audit log rotation — deletes logs older than 365 days.
 * Called by Vercel Cron (daily at 2 AM UTC).
 */
export async function GET(request: NextRequest) {
    // Verify cron secret (Vercel sends this header for cron jobs)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || !authHeader || !safeCompare(authHeader, `Bearer ${cronSecret}`)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const retentionDays = 730;
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString();

    // Use a service-level client — cron has no user context
    // We use getUserClient with a system identity for RPC calls
    // The delete_audit_logs_before RPC is SECURITY DEFINER so it works
    const client = await getUserClient("00000000-0000-0000-0000-000000000000", "SUPER_ADMIN");

    const { data, error } = await AdminDAL.deleteAuditLogsBefore(client, cutoffDate);

    if (error) {
        console.error(JSON.stringify({
            level: "error",
            service: "cron/cleanup-logs",
            operation: "delete_audit_logs_before",
            timestamp: new Date().toISOString(),
            retentionDays,
            cutoffDate,
            error: error.message,
            code: error.code,
        }));
        return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
    }

    const deletedCount = data?.[0]?.deleted_count ?? 0;
    console.log(JSON.stringify({
        level: "info",
        service: "cron/cleanup-logs",
        operation: "delete_audit_logs_before",
        timestamp: new Date().toISOString(),
        deletedCount,
        retentionDays,
        cutoffDate,
    }));

    // H07: Also clean up old login attempts (90-day retention)
    const loginRetentionDays = 90;
    const loginAttemptCutoff = new Date(Date.now() - loginRetentionDays * 24 * 60 * 60 * 1000).toISOString();
    const { data: loginData, error: loginError } = await client.rpc(
        "delete_login_attempts_before",
        { cutoff: loginAttemptCutoff }
    );
    const loginDeletedCount = loginData?.[0]?.deleted_count ?? 0;
    if (loginError) {
        console.error(JSON.stringify({
            level: "error",
            service: "cron/cleanup-logs",
            operation: "delete_login_attempts_before",
            timestamp: new Date().toISOString(),
            retentionDays: loginRetentionDays,
            cutoffDate: loginAttemptCutoff,
            error: loginError.message,
            code: loginError.code,
        }));
    } else {
        console.log(JSON.stringify({
            level: "info",
            service: "cron/cleanup-logs",
            operation: "delete_login_attempts_before",
            timestamp: new Date().toISOString(),
            deletedCount: loginDeletedCount,
            retentionDays: loginRetentionDays,
            cutoffDate: loginAttemptCutoff,
        }));
    }

    return NextResponse.json({
        success: true,
        deletedCount,
        loginAttemptsDeleted: loginDeletedCount,
        cutoffDate,
        retentionDays,
    });
}
