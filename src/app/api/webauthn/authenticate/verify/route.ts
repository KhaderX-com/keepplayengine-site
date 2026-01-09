import { NextRequest, NextResponse } from "next/server";
import { verifyAuthenticationResponse } from "@/lib/webauthn";
import { supabaseAdmin } from "@/lib/supabase";
import { getClientIP, getDeviceInfo } from "@/lib/request-utils";

/**
 * POST /api/webauthn/authenticate/verify
 * Verify biometric authentication and create session
 */
export async function POST(request: NextRequest) {
    try {
        const { credential } = await request.json();
        const challenge = request.cookies.get("webauthn_auth_challenge")?.value;
        const email = request.cookies.get("webauthn_auth_email")?.value;

        if (!challenge) {
            return NextResponse.json(
                { error: "Challenge expired or not found" },
                { status: 400 }
            );
        }

        if (!email) {
            return NextResponse.json(
                { error: "Email not found in session" },
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
                authenticatorData: new Uint8Array(credential.response.authenticatorData).buffer,
                signature: new Uint8Array(credential.response.signature).buffer,
                userHandle: credential.response.userHandle
                    ? new Uint8Array(credential.response.userHandle).buffer
                    : null,
            },
        };

        // Verify the credential
        const result = await verifyAuthenticationResponse(
            processedCredential
        );

        if (!result.success) {
            return NextResponse.json(
                { error: "Authentication failed" },
                { status: 401 }
            );
        }

        // Get user details
        const { data: user, error: userError } = await supabaseAdmin
            .from("admin_users")
            .select("id, email, full_name, role")
            .eq("id", result.userId)
            .eq("is_active", true)
            .single();

        if (userError || !user) {
            console.error("User lookup failed:", userError);
            return NextResponse.json(
                { error: "User not found or inactive" },
                { status: 404 }
            );
        }

        // Log successful biometric authentication with proper IP extraction
        const ipAddress = getClientIP(request);
        const userAgent = request.headers.get("user-agent") || null;
        const deviceInfo = getDeviceInfo(userAgent);

        await supabaseAdmin.from("admin_login_attempts").insert({
            email: user.email,
            ip_address: ipAddress,
            user_agent: userAgent,
            success: true,
            admin_user_id: user.id,
            attempt_type: "biometric",
            failure_reason: null,
            device_info: deviceInfo,
            geo_location: {},
        });

        await supabaseAdmin.from("admin_activity_log").insert({
            admin_user_id: user.id,
            action: "biometric_login",
            resource_type: "authentication",
            ip_address: ipAddress,
            user_agent: userAgent,
            description: "Successful biometric authentication",
            severity: "info",
            changes: { device_info: deviceInfo },
        });

        // Clear cookies
        const response = NextResponse.json({
            success: true,
            userId: user.id,
            message: "Biometric authentication successful",
        });

        response.cookies.delete("webauthn_auth_challenge");
        response.cookies.delete("webauthn_auth_email");

        return response;
    } catch (error) {
        const err = error as Error;
        console.error("Error verifying authentication:", err);

        // Log failed attempt with proper IP extraction
        const email = request.cookies.get("webauthn_auth_email")?.value;
        if (email) {
            const ipAddress = getClientIP(request);
            const userAgent = request.headers.get("user-agent") || null;
            const deviceInfo = getDeviceInfo(userAgent);

            await supabaseAdmin.from("admin_login_attempts").insert({
                email,
                ip_address: ipAddress,
                user_agent: userAgent,
                success: false,
                attempt_type: "biometric",
                failure_reason: err.message || "Biometric verification failed",
                device_info: deviceInfo,
                geo_location: {},
            });
        }

        return NextResponse.json(
            { error: "Failed to verify authentication", details: err.message },
            { status: 500 }
        );
    }
}
