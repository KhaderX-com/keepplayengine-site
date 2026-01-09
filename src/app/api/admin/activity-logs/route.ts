import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "SUPER_ADMIN") {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get("limit") || "50");
        const offset = parseInt(searchParams.get("offset") || "0");

        // Fetch activity logs from Supabase
        const { data: logs, error, count } = await supabaseAdmin
            .from("admin_activity_log")
            .select("*", { count: "exact" })
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            throw error;
        }

        // Fetch user details for the logs
        const userIds = [...new Set(logs?.map((log: { admin_user_id: string }) => log.admin_user_id).filter(Boolean))];

        const { data: users } = await supabaseAdmin
            .from("admin_users")
            .select("id, email, full_name")
            .in("id", userIds);

        // Map user details to logs
        const logsWithUsers = logs?.map(log => ({
            ...log,
            user: users?.find(u => u.id === log.admin_user_id),
        }));

        return NextResponse.json({
            logs: logsWithUsers || [],
            total: count || 0,
            limit,
            offset,
        });
    } catch (error) {
        console.error("Error fetching activity logs:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/admin/activity-logs
 * Delete audit logs before a specific date (SUPER_ADMIN only)
 */
export async function DELETE(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        // Only SUPER_ADMIN can delete audit logs
        if (!session || session.user.role !== "SUPER_ADMIN") {
            return NextResponse.json(
                { error: "Unauthorized - SUPER_ADMIN access required" },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { deleteBeforeDate } = body;

        if (!deleteBeforeDate) {
            return NextResponse.json(
                { error: "deleteBeforeDate is required" },
                { status: 400 }
            );
        }

        // Validate date format
        const deleteBefore = new Date(deleteBeforeDate);
        if (isNaN(deleteBefore.getTime())) {
            return NextResponse.json(
                { error: "Invalid date format" },
                { status: 400 }
            );
        }

        // Prevent accidental deletion of recent logs (must be at least 1 day old)
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);

        if (deleteBefore > oneDayAgo) {
            return NextResponse.json(
                { error: "Cannot delete logs from the last 24 hours" },
                { status: 400 }
            );
        }

        // Get the request details for logging
        const ipAddress = request.headers.get("x-forwarded-for") ||
            request.headers.get("x-real-ip") ||
            "unknown";
        const userAgent = request.headers.get("user-agent");

        // Call the database function to delete logs
        const { data, error } = await supabaseAdmin
            .rpc('delete_audit_logs_before', {
                delete_before_date: deleteBefore.toISOString()
            });

        if (error) {
            console.error("Error deleting audit logs:", error);
            throw error;
        }

        const deletedCount = data?.[0]?.deleted_count || 0;

        // Log this deletion action itself
        await supabaseAdmin
            .from('admin_activity_log')
            .insert({
                admin_user_id: session.user.id,
                action: 'DELETE_AUDIT_LOGS',
                resource_type: 'audit_logs',
                ip_address: ipAddress,
                user_agent: userAgent,
                description: `Deleted ${deletedCount} audit log(s) older than ${deleteBefore.toISOString()}`,
                severity: 'critical',
                changes: {
                    deleted_count: deletedCount,
                    delete_before_date: deleteBefore.toISOString()
                }
            });

        return NextResponse.json({
            success: true,
            deletedCount,
            message: `Successfully deleted ${deletedCount} audit log(s)`
        });

    } catch (error) {
        console.error("Error in DELETE audit logs:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
