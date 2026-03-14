import { NextResponse } from "next/server";
import { createApiHandler } from "@/lib/api-gateway";
import { AdminDAL, getUserClient } from "@/lib/dal";
import { deleteActivityLogsSchema } from "@/lib/schemas";

export const GET = createApiHandler(
    { requiredRoles: ["SUPER_ADMIN"], skipContentType: true },
    async (request, { session }) => {
        const { searchParams } = new URL(request.url);
        const rawLimit = parseInt(searchParams.get("limit") || "50", 10);
        const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 200) : 50;
        const rawOffset = parseInt(searchParams.get("offset") || "0", 10);
        const offset = Number.isFinite(rawOffset) ? Math.max(rawOffset, 0) : 0;

        const client = await getUserClient(session.user.id, session.user.role);
        const { data: logs, error, count } = await AdminDAL.getActivityLogs(client, { limit, offset });

        if (error) throw error;

        return NextResponse.json({
            logs: logs || [],
            total: count || 0,
            limit,
            offset,
        });
    },
);

export const DELETE = createApiHandler(
    { requiredRoles: ["SUPER_ADMIN"] },
    async (request, { session, ip, userAgent }) => {
        // Parse body manually — gateway skips bodySchema for DELETE requests
        let rawBody: unknown;
        try {
            rawBody = await request.json();
        } catch {
            return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
        }

        const parsed = deleteActivityLogsSchema.safeParse(rawBody);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Validation failed", details: parsed.error.flatten() },
                { status: 400 },
            );
        }

        const deleteBefore = new Date(parsed.data.deleteBeforeDate);

        // Prevent deletion of recent logs
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        if (deleteBefore > oneDayAgo) {
            return NextResponse.json(
                { error: "Cannot delete logs from the last 24 hours" },
                { status: 400 },
            );
        }

        const client = await getUserClient(session.user.id, session.user.role);
        const { data, error } = await AdminDAL.deleteAuditLogsBefore(
            client,
            deleteBefore.toISOString(),
        );
        if (error) throw error;

        const deletedCount = typeof data === "number" ? data : (data as unknown as { deleted_count: number }[])?.[0]?.deleted_count || 0;

        await AdminDAL.logActivity(client, {
            admin_user_id: session.user.id,
            action: "DELETE_AUDIT_LOGS",
            resource_type: "audit_logs",
            ip_address: ip,
            user_agent: userAgent,
            description: `Deleted ${deletedCount} audit log(s) older than ${deleteBefore.toISOString()}`,
            severity: "critical",
            changes: { deleted_count: deletedCount, delete_before_date: deleteBefore.toISOString() },
        });

        return NextResponse.json({
            success: true,
            deletedCount,
            message: `Successfully deleted ${deletedCount} audit log(s)`,
        });
    },
);
