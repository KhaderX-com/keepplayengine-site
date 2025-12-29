import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { verifyRegistrationResponse } from "@/lib/webauthn";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * POST /api/webauthn/register/verify
 * Verify and store a biometric credential registration
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Only allow admins to register biometric
        if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { credential, deviceName } = await request.json();
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
            session.user.id,
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
            admin_user_id: session.user.id,
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
