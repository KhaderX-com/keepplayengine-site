import { NextRequest, NextResponse } from "next/server";
import { generateAuthenticationOptions } from "@/lib/webauthn";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * POST /api/webauthn/authenticate/options
 * Generate authentication options for biometric login
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
            .select("id")
            .eq("email", email)
            .eq("is_active", true)
            .single();

        if (userError || !user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // Check if user has any enrolled credentials
        const { data: credentials } = await supabaseAdmin
            .from("webauthn_credentials")
            .select("id")
            .eq("user_id", user.id)
            .limit(1);

        if (!credentials || credentials.length === 0) {
            return NextResponse.json(
                { error: "No biometric credentials enrolled" },
                { status: 400 }
            );
        }

        const { options, challenge } = await generateAuthenticationOptions(user.id);

        // Store challenge for verification
        const response = NextResponse.json({
            success: true,
            options: {
                ...options,
                challenge: Array.from(new Uint8Array(options.challenge as ArrayBuffer)),
                allowCredentials: options.allowCredentials?.map((cred) => ({
                    ...cred,
                    id: Array.from(new Uint8Array(cred.id as ArrayBuffer)),
                })),
            },
            challenge,
        });

        // Store challenge in cookie
        response.cookies.set("webauthn_auth_challenge", challenge, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 300, // 5 minutes
        });

        // Also store email for verification
        response.cookies.set("webauthn_auth_email", email, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 300,
        });

        return response;
    } catch (error) {
        const err = error as Error;
        console.error("Error generating authentication options:", err);
        return NextResponse.json(
            { error: "Failed to generate authentication options", details: err.message },
            { status: 500 }
        );
    }
}
