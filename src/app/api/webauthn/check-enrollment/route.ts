import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * POST /api/webauthn/check-enrollment
 * Check if a user has biometric authentication enrolled
 */
export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: "Email required" }, { status: 400 });
        }

        // Get user by email
        const { data: user, error: userError } = await supabaseAdmin
            .from("admin_users")
            .select("id, biometric_enabled")
            .eq("email", email)
            .eq("is_active", true)
            .single();

        if (userError || !user) {
            return NextResponse.json({ enrolled: false });
        }

        // Check if user has any credentials
        const { data: credentials } = await supabaseAdmin
            .from("webauthn_credentials")
            .select("id")
            .eq("user_id", user.id)
            .limit(1);

        const enrolled = user.biometric_enabled && credentials && credentials.length > 0;

        return NextResponse.json({
            enrolled,
            biometricEnabled: user.biometric_enabled,
        });
    } catch (error: unknown) {
        console.error("Error checking enrollment:", error);
        return NextResponse.json({ enrolled: false });
    }
}
