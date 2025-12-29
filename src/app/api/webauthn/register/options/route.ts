import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import {
    generateRegistrationOptions,
} from "@/lib/webauthn";

/**
 * POST /api/webauthn/register/options
 * Generate registration options for enrolling a biometric credential
 * Works BEFORE session is created (during login flow)
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
            .select("id, full_name, email")
            .eq("email", email)
            .eq("is_active", true)
            .single();

        if (userError || !user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const { options, challenge } = await generateRegistrationOptions(
            user.id,
            user.full_name || user.email || "Admin",
            user.email || "admin@keepplayengine.com"
        );

        // Store challenge in session or temporary storage
        // For production, use Redis or database
        const response = NextResponse.json({
            success: true,
            options: {
                ...options,
                challenge: Array.from(new Uint8Array(options.challenge as ArrayBuffer)),
                user: {
                    ...options.user,
                    id: Array.from(new Uint8Array(options.user.id as ArrayBuffer)),
                },
                excludeCredentials: options.excludeCredentials?.map((cred) => ({
                    ...cred,
                    id: Array.from(new Uint8Array(cred.id as ArrayBuffer)),
                })),
            },
            challenge,
        });

        // Store challenge in cookie for verification
        response.cookies.set("webauthn_challenge", challenge, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 300, // 5 minutes
        });

        return response;
    } catch (error) {
        const err = error as Error;
        console.error("Error generating registration options:", err);
        return NextResponse.json(
            { error: "Failed to generate registration options", details: err.message },
            { status: 500 }
        );
    }
}
