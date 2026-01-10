import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "SUPER_ADMIN") {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Fetch active sessions from Supabase (exclude admin@keepplayengine.com - dev account)
        const { data: sessions, error } = await supabaseAdmin
            .from("admin_sessions")
            .select(`
                *,
                admin_users!admin_sessions_admin_user_id_fkey (
                    id,
                    email,
                    full_name,
                    role
                )
            `)
            .gte("expires_at", new Date().toISOString())
            .eq("is_revoked", false)
            .order("last_activity_at", { ascending: false })
            .limit(50);

        if (error) {
            throw error;
        }

        // Filter out admin@keepplayengine.com (dev account) and format response
        const filteredSessions = sessions
            ?.filter((s: any) => s.admin_users?.email !== 'admin@keepplayengine.com')
            .map((session: any) => ({
                ...session,
                user: session.admin_users
            })) || [];

        return NextResponse.json({
            sessions: filteredSessions,
        });
    } catch (error) {
        console.error("Error fetching sessions:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "SUPER_ADMIN") {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get("id");

        if (!sessionId) {
            return NextResponse.json(
                { error: "Session ID required" },
                { status: 400 }
            );
        }

        // Delete session from Supabase
        const { error } = await supabaseAdmin
            .from("admin_sessions")
            .delete()
            .eq("id", sessionId);

        if (error) {
            throw error;
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting session:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
