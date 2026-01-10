import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * Update session activity timestamp
 * Called periodically from the client to track active sessions
 * Excludes admin@keepplayengine.com (dev account)
 */
export async function POST() {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Skip updating for admin@keepplayengine.com (dev account)
        if (session.user.email === 'admin@keepplayengine.com') {
            return NextResponse.json({ success: true, skipped: true });
        }

        // Update all active sessions for this user
        const { error } = await supabaseAdmin
            .from("admin_sessions")
            .update({
                last_activity_at: new Date().toISOString(),
            })
            .eq("admin_user_id", session.user.id)
            .gte("expires_at", new Date().toISOString())
            .eq("is_revoked", false);

        if (error) {
            console.error("Error updating session activity:", error);
            return NextResponse.json(
                { error: "Failed to update session" },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Session activity error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * Clean up expired sessions
 * Can be called periodically or manually
 */
export async function DELETE() {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "SUPER_ADMIN") {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Delete expired sessions
        const { error, count } = await supabaseAdmin
            .from("admin_sessions")
            .delete()
            .lt("expires_at", new Date().toISOString());

        if (error) {
            throw error;
        }

        return NextResponse.json({
            success: true,
            deletedCount: count || 0
        });
    } catch (error) {
        console.error("Error cleaning sessions:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
