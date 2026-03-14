import { NextResponse } from "next/server";
import { createApiHandler } from "@/lib/api-gateway";
import { WebAuthnDAL, AdminDAL } from "@/lib/dal";
import { generateRegistrationOptions } from "@/lib/webauthn";
import { webauthnEmailSchema } from "@/lib/schemas";

/**
 * POST /api/webauthn/register/options
 * Generate registration options — PUBLIC (pre-login enrollment flow)
 * Returns JSON-serializable options with base64url-encoded values.
 */
export const POST = createApiHandler(
    {
        skipAuth: true,
        bodySchema: webauthnEmailSchema,
        rateLimit: { limit: 10, windowMs: 60_000 },
    },
    async (_req, ctx) => {
        // Check if enrollment is allowed
        const { data: config, error: configError } = await WebAuthnDAL.getBiometricConfig();
        if (configError || !config) {
            return NextResponse.json(
                { error: "Biometric enrollment is not available. Please contact your administrator." },
                { status: 403 },
            );
        }
        if (!config.biometric_enabled) {
            return NextResponse.json(
                { error: "Biometric authentication is currently disabled." },
                { status: 403 },
            );
        }
        if (!config.allow_enrollment) {
            return NextResponse.json(
                { error: "Biometric enrollment is not permitted at this time. Please contact your administrator." },
                { status: 403 },
            );
        }

        // Get user by email
        const { data: user, error: userError } = await AdminDAL.getAdminUserByEmail(ctx.body.email);
        if (userError || !user || !user.is_active) {
            // Generic error to prevent user enumeration
            return NextResponse.json({ error: "Enrollment is not available" }, { status: 403 });
        }

        const { options, challenge } = await generateRegistrationOptions(
            user.id,
            user.full_name || user.email || "Admin",
            user.email,
        );

        // Options are already JSON-serializable (base64url strings from @simplewebauthn/server)
        const response = NextResponse.json({
            success: true,
            options,
            challenge,
        });

        // Store challenge server-side (DB) instead of cookie
        await WebAuthnDAL.storeChallenge(ctx.body.email, challenge, "registration");

        return response;
    },
);
