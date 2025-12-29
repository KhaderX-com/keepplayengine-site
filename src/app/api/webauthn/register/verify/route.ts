import { NextRequest, NextResponse } from "next/server";
import { verifyRegistrationResponse } from "@/lib/webauthn";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * POST /api/webauthn/register/verify
 * Verify and store a biometric credential registration
 * Works BEFORE session is created (during login flow)
 */
export async function POST(request: NextRequest) {
    try {
        const { email, credential, deviceName } = await request.json();

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
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const challenge = request.cookies.get("webauthn_challenge")?.value;

        if (!challenge) {
            return NextResponse.json(
                { error: "Challenge expired or not found" },
                { status: 400 }
            );
        }

        // Convert credential arrays back to ArrayBuffers
        const processedCredential = {
            ...credential,
            rawId: new Uint8Array(credential.rawId).buffer,
            response: {
                ...credential.response,
                clientDataJSON: new Uint8Array(credential.response.clientDataJSON).buffer,
                attestationObject: new Uint8Array(credential.response.attestationObject).buffer,
            },
        };

        // Verify and store the credential
        const result = await verifyRegistrationResponse(
            user.id,
            processedCredential,
            challenge,
            deviceName
        );

        // Clear challenge cookie
        const response = NextResponse.json({
            success: true,
            credentialId: result.credentialId,
            message: "Biometric authentication enabled successfully",
        });

        response.cookies.delete("webauthn_challenge");

        // Log the activity
        const ipAddress = request.headers.get("x-forwarded-for") ||
            request.headers.get("x-real-ip") ||
            "unknown";
        const userAgent = request.headers.get("user-agent") || null;

        await supabaseAdmin.from("admin_activity_log").insert({
            admin_user_id: user.id,
            action: "biometric_enrolled",
            resource_type: "authentication",
            ip_address: ipAddress,
            user_agent: userAgent,
            description: `Enrolled biometric device: ${deviceName || "Unnamed device"}`,
            severity: "info",
            changes: {},
        });

        return response;
    } catch (error) {
        const err = error as Error;
        console.error("Error verifying registration:", err);
        return NextResponse.json(
            { error: "Failed to verify registration", details: err.message },
            { status: 500 }
        );
    }
}
