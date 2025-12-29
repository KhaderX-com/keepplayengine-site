import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import bcrypt from "bcryptjs";

/**
 * POST /api/auth/verify-credentials
 * Verify user credentials WITHOUT creating a session
 * Used for 2FA flow where we need to check biometric before session creation
 */
export async function POST(request: NextRequest) {
    console.log("verify-credentials endpoint called"); // Debug
    try {
        const body = await request.json();
        console.log("Request body:", { email: body.email, hasPassword: !!body.password }); // Debug

        const { email, password } = body;

        if (!email || !password) {
            console.error("Missing email or password");
            return NextResponse.json(
                { error: "Email and password required", valid: false },
                { status: 400 }
            );
        }

        // Get admin user
        const { data: admin, error: adminError } = await supabaseAdmin
            .from("admin_users")
            .select("*")
            .eq("email", email)
            .eq("is_active", true)
            .single();

        if (adminError || !admin || !admin.password_hash) {
            console.error("Admin not found:", email, adminError);
            return NextResponse.json(
                { error: "Invalid credentials", valid: false },
                { status: 401 }
            );
        }

        // Check if admin account is locked
        if (admin.is_locked) {
            if (admin.locked_until && new Date(admin.locked_until) > new Date()) {
                return NextResponse.json(
                    { error: `Account is locked until ${new Date(admin.locked_until).toLocaleString()}`, valid: false },
                    { status: 403 }
                );
            }
        }

        // Verify password
        const passwordValid = await bcrypt.compare(password, admin.password_hash);

        if (!passwordValid) {
            console.error("Invalid password for:", email);

            // Log failed attempt
            const ipAddress = request.headers.get("x-forwarded-for") ||
                request.headers.get("x-real-ip") ||
                "unknown";
            const userAgent = request.headers.get("user-agent") || null;

            await supabaseAdmin.from("admin_login_attempts").insert({
                email,
                ip_address: ipAddress,
                user_agent: userAgent,
                success: false,
                admin_user_id: null,
                attempt_type: "password",
                failure_reason: "Invalid password",
                device_info: {},
                geo_location: {},
            });

            return NextResponse.json(
                { error: "Invalid credentials", valid: false },
                { status: 401 }
            );
        }

        // Password is valid
        console.log("Credentials verified for:", email);

        return NextResponse.json({
            valid: true,
            userId: admin.id,
            email: admin.email,
            name: admin.name,
        });
    } catch (error) {
        console.error("Error verifying credentials:", error);
        console.error("Error details:", error instanceof Error ? error.message : String(error));
        return NextResponse.json(
            { error: "Authentication failed", valid: false },
            { status: 500 }
        );
    }
}
