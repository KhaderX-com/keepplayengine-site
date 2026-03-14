import { NextRequest, NextResponse } from "next/server";
import { createApiHandler } from "@/lib/api-gateway";
import { AdminDAL, WebAuthnDAL } from "@/lib/dal";
import { verifyRegistrationResponse } from "@/lib/webauthn";
import { getClientIP, getDeviceInfo } from "@/lib/request-utils";
import { webauthnRegisterVerifySchema } from "@/lib/schemas";
import type { RegistrationResponseJSON } from "@simplewebauthn/server";

/**
 * POST /api/webauthn/register/verify
 * Verify and store a biometric credential — PUBLIC (pre-login enrollment)
 * Uses @simplewebauthn/server for full cryptographic attestation verification.
 */
export const POST = createApiHandler(
    {

        skipAuth: true,
        bodySchema: webauthnRegisterVerifySchema,
        rateLimit: { limit: 10, windowMs: 60_000 },
    },
    async (req: NextRequest, ctx) => {
        const { email, credential, deviceName } = ctx.body;

        const { data: user, error: userError } = await AdminDAL.getAdminUserByEmail(email);
        if (userError || !user || !user.is_active) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const challenge = await WebAuthnDAL.getChallenge(email, "registration");
        if (!challenge) {
            return NextResponse.json({ error: "Challenge expired or not found" }, { status: 400 });
        }

        // Pass the credential directly as RegistrationResponseJSON (base64url format)
        // @simplewebauthn/server handles all cryptographic verification:
        // - Challenge match, origin validation, RP ID check
        // - Attestation verification, public key extraction
        const result = await verifyRegistrationResponse(
            user.id,
            credential as RegistrationResponseJSON,
            challenge,
            deviceName,
        );

        const response = NextResponse.json({
            success: true,
            credentialId: result.credentialId,
            message: "Biometric authentication enabled successfully",
        });

        // Clean up server-side challenge
        await WebAuthnDAL.deleteChallenge(email, "registration");

        // Log activity (service-role — pre-login context)
        const ipAddress = getClientIP(req);
        const userAgent = req.headers.get("user-agent") || null;
        const deviceInfo = getDeviceInfo(userAgent);

        await AdminDAL.logActivityServiceRole({
            admin_user_id: user.id,
            action: "biometric_enrolled",
            resource_type: "authentication",
            ip_address: ipAddress,
            user_agent: userAgent,
            description: `Enrolled biometric device: ${deviceName || "Unnamed device"}`,
            severity: "info",
            changes: { device_info: deviceInfo },
        });

        return response;
    },
);
