import { NextRequest, NextResponse } from "next/server";
import { createApiHandler } from "@/lib/api-gateway";
import { AdminDAL, WebAuthnDAL } from "@/lib/dal";
import { verifyAuthenticationResponse } from "@/lib/webauthn";
import { getClientIP, getDeviceInfo } from "@/lib/request-utils";
import { sendSecurityAlert } from "@/lib/security-alerts";
import { webauthnAuthVerifySchema } from "@/lib/schemas";
import type { AuthenticationResponseJSON } from "@simplewebauthn/server";

/**
 * POST /api/webauthn/authenticate/verify
 * Verify biometric authentication — PUBLIC (pre-login)
 * Uses @simplewebauthn/server for full cryptographic signature verification.
 */
export const POST = createApiHandler(
    {
        skipAuth: true,
        bodySchema: webauthnAuthVerifySchema,
        rateLimit: { limit: 10, windowMs: 60_000 },
    },
    async (req: NextRequest, ctx) => {
        const email = ctx.body.email;
        const challenge = await WebAuthnDAL.getChallenge(email, "authentication");

        if (!challenge) {
            return NextResponse.json({ error: "Challenge expired or not found" }, { status: 400 });
        }

        const ipAddress = getClientIP(req);
        const userAgent = req.headers.get("user-agent") || null;
        const deviceInfo = getDeviceInfo(userAgent);

        // Pass the credential directly as AuthenticationResponseJSON (base64url format)
        // @simplewebauthn/server handles all cryptographic verification:
        // - Challenge match, origin validation, RP ID check
        // - Signature verification against stored public key
        // - Counter increment validation (anti-replay)
        let result: { success: boolean; userId?: string };
        try {
            result = await verifyAuthenticationResponse(ctx.body.credential as AuthenticationResponseJSON, challenge);
        } catch (err) {
            // Log failed attempt
            await AdminDAL.recordLoginAttempt({
                email,
                ip_address: ipAddress,
                user_agent: userAgent,
                success: false,
                attempt_type: "biometric",
                failure_reason: (err as Error).message || "Biometric verification failed",
                device_info: deviceInfo,
            });
            // Alert SUPER_ADMINs about biometric failure (non-blocking)
            sendSecurityAlert({
                event: "biometric_failure",
                email,
                ipAddress,
                description: `Biometric authentication failed: ${(err as Error).message || "Unknown error"}`,
                severity: "warning",
            });
            throw err;
        }

        if (!result.success) {
            return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
        }

        // Get user details
        const { data: user, error: userError } = await AdminDAL.getAdminUserById(result.userId!);
        if (userError || !user || !user.is_active) {
            return NextResponse.json({ error: "User not found or inactive" }, { status: 404 });
        }

        // Log successful biometric authentication
        await AdminDAL.recordLoginAttempt({
            email: user.email,
            ip_address: ipAddress,
            user_agent: userAgent,
            success: true,
            admin_user_id: user.id,
            attempt_type: "biometric",
            failure_reason: null,
            device_info: deviceInfo,
        });

        await AdminDAL.logActivityServiceRole({
            admin_user_id: user.id,
            action: "biometric_login",
            resource_type: "authentication",
            ip_address: ipAddress,
            user_agent: userAgent,
            description: "Successful biometric authentication",
            severity: "info",
            changes: { device_info: deviceInfo },
        });

        const response = NextResponse.json({
            success: true,
            userId: user.id,
            message: "Biometric authentication successful",
        });

        // Clean up server-side challenge
        await WebAuthnDAL.deleteChallenge(email, "authentication");

        return response;
    },
);
