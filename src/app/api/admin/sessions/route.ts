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

        // Fetch active sessions from Supabase
        const { data: sessions, error } = await supabaseAdmin
            .from("admin_sessions")
            .select("*")
            .gte("expires_at", new Date().toISOString())
            .order("created_at", { ascending: false })
            .limit(20);

        if (error) {
            throw error;
        }

        // Fetch user details for sessions
        const userIds = [...new Set(sessions?.map((s: { admin_user_id: string }) => s.admin_user_id).filter(Boolean))];

        const { data: users } = await supabaseAdmin
            .from("admin_users")
            .select("id, email, full_name")
            .in("id", userIds);

        // Map user details to sessions
        const sessionsWithUsers = sessions?.map(session => ({
            ...session,
            user: users?.find(u => u.id === session.admin_user_id),
        }));

        return NextResponse.json({
            sessions: sessionsWithUsers || [],
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
