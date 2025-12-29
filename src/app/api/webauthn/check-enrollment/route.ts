import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * POST /api/webauthn/check-enrollment
 * Check if a user has biometric authentication enrolled
 */
export async function POST(request: NextRequest) {
    console.log("check-enrollment endpoint called"); // Debug
    try {
        const body = await request.json();
        console.log("Check enrollment body:", body); // Debug
        const { email } = body;

        if (!email) {
            console.error("No email provided");
            return NextResponse.json({ error: "Email required", enrolled: false }, { status: 400 });
        }

        console.log("Checking enrollment for:", email); // Debug

        // Get user by email
        const { data: user, error: userError } = await supabaseAdmin
            .from("admin_users")
            .select("id, biometric_enabled")
            .eq("email", email)
            .eq("is_active", true)
            .single();

        console.log("User query result:", { user, userError }); // Debug

        if (userError || !user) {
            console.log("User not found or error, returning enrolled: false");
            return NextResponse.json({ enrolled: false });
        }

        // Check if user has any credentials
        const { data: credentials, error: credError } = await supabaseAdmin
            .from("webauthn_credentials")
            .select("id")
            .eq("user_id", user.id)
            .limit(1);

        console.log("Credentials query result:", { credentials, credError }); // Debug

        const enrolled = user.biometric_enabled && credentials && credentials.length > 0;

        console.log("Final enrolled status:", enrolled); // Debug

        return NextResponse.json({
            enrolled,
            biometricEnabled: user.biometric_enabled,
        });
    } catch (error) {
        console.error("Error checking enrollment:", error);
        console.error("Error details:", error instanceof Error ? error.message : String(error));
        return NextResponse.json({ enrolled: false });
    }
}
