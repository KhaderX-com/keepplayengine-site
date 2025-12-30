import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * Admin Statistics API - Supabase Only (No Prisma)
 * 
 * Security: Uses supabaseAdmin with service role for server-side only access
 * All data fetched from Supabase with RLS protection
 */

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "SUPER_ADMIN") {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const now = new Date();
        const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
        const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

        // Fetch all statistics from Supabase in parallel
        const [
            usersResult,
            sessionsResult,
            recentLoginsResult,
            failedAttemptsResult,
            biometricDevicesResult,
            loginTrendResult,
        ] = await Promise.all([
            // Total admin users
            supabaseAdmin
                .from("admin_users")
                .select("*", { count: "exact", head: true }),

            // Active sessions (not expired)
            supabaseAdmin
                .from("admin_sessions")
                .select("*", { count: "exact", head: true })
                .gte("expires_at", now.toISOString()),

            // Successful logins in last 24 hours
            supabaseAdmin
                .from("admin_login_attempts")
                .select("*", { count: "exact", head: true })
                .eq("success", true)
                .gte("created_at", last24Hours),

            // Failed attempts in last 24 hours
            supabaseAdmin
                .from("admin_login_attempts")
                .select("*", { count: "exact", head: true })
                .eq("success", false)
                .gte("created_at", last24Hours),

            // Biometric devices registered
            supabaseAdmin
                .from("webauthn_credentials")
                .select("*", { count: "exact", head: true }),

            // Login trend (successful logins in last 7 days)
            supabaseAdmin
                .from("admin_login_attempts")
                .select("*", { count: "exact", head: true })
                .eq("success", true)
                .gte("created_at", last7Days),
        ]);

        return NextResponse.json({
            totalUsers: usersResult.count || 0,
            activeSessions: sessionsResult.count || 0,
            recentLogins: recentLoginsResult.count || 0,
            failedAttempts: failedAttemptsResult.count || 0,
            biometricDevices: biometricDevicesResult.count || 0,
            loginTrend: loginTrendResult.count || 0,
        });
    } catch (error) {
        console.error("Error fetching admin stats:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
