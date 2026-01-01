import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * Admin Statistics API - Comprehensive Dashboard Stats
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
            biometricLoginsResult,
            passwordLoginsResult,
            uniqueIPsResult,
        ] = await Promise.all([
            // Total admin users
            supabaseAdmin
                .from("admin_users")
                .select("*", { count: "exact", head: true }),

            // Active sessions (not expired and not revoked)
            supabaseAdmin
                .from("admin_sessions")
                .select("*", { count: "exact", head: true })
                .gte("expires_at", now.toISOString())
                .eq("is_revoked", false),

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

            // Biometric logins in last 24h
            supabaseAdmin
                .from("admin_login_attempts")
                .select("*", { count: "exact", head: true })
                .eq("success", true)
                .eq("attempt_type", "biometric")
                .gte("created_at", last24Hours),

            // Password logins in last 24h
            supabaseAdmin
                .from("admin_login_attempts")
                .select("*", { count: "exact", head: true })
                .eq("success", true)
                .eq("attempt_type", "password")
                .gte("created_at", last24Hours),

            // Get unique IPs from recent logins
            supabaseAdmin
                .from("admin_login_attempts")
                .select("ip_address")
                .gte("created_at", last24Hours),
        ]);

        // Calculate unique IPs (excluding localhost)
        const uniqueIPs = new Set(
            uniqueIPsResult.data
                ?.map(r => r.ip_address)
                .filter(ip => ip && ip !== '::1' && ip !== '127.0.0.1' && ip !== 'unknown') || []
        ).size;

        return NextResponse.json({
            totalUsers: usersResult.count || 0,
            activeSessions: sessionsResult.count || 0,
            recentLogins: recentLoginsResult.count || 0,
            failedAttempts: failedAttemptsResult.count || 0,
            biometricDevices: biometricDevicesResult.count || 0,
            loginTrend: loginTrendResult.count || 0,
            // New detailed stats
            biometricLogins24h: biometricLoginsResult.count || 0,
            passwordLogins24h: passwordLoginsResult.count || 0,
            uniqueIPs24h: uniqueIPs,
        });
    } catch (error) {
        console.error("Error fetching admin stats:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
