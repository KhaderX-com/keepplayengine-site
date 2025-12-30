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
            .select("uuid, email, username")
            .in("uuid", userIds);

        // Map user details to logs
        const logsWithUsers = logs?.map(log => ({
            ...log,
            user: users?.find(u => u.uuid === log.admin_user_id),
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
