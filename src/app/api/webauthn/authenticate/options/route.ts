import { NextResponse } from "next/server";
import { createApiHandler } from "@/lib/api-gateway";
import { AdminDAL, WebAuthnDAL } from "@/lib/dal";
import { generateAuthenticationOptions } from "@/lib/webauthn";
import { webauthnEmailSchema } from "@/lib/schemas";

/**
 * POST /api/webauthn/authenticate/options
 * Generate authentication options for biometric login — PUBLIC (pre-login)
 * Returns JSON-serializable options with base64url-encoded values.
 */
export const POST = createApiHandler(
    {
        skipAuth: true,
        bodySchema: webauthnEmailSchema,
        rateLimit: { limit: 10, windowMs: 60_000 },
    },
    async (_req, ctx) => {
        const { data: user, error: userError } = await AdminDAL.getAdminUserByEmail(ctx.body.email);
        if (userError || !user || !user.is_active) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Check if user has enrolled credentials
        const enrollment = await WebAuthnDAL.checkEnrollment(ctx.body.email);
        if (!enrollment.enrolled) {
            return NextResponse.json(
                { error: "No biometric credentials enrolled" },
                { status: 400 },
            );
        }

        const { options, challenge } = await generateAuthenticationOptions(user.id);

        // Options are already JSON-serializable (base64url strings from @simplewebauthn/server)
        const response = NextResponse.json({
            success: true,
            options,
            challenge,
        });

        // Store challenge and email server-side (DB) instead of cookies
        await WebAuthnDAL.storeChallenge(ctx.body.email, challenge, "authentication");

        return response;
    },
);
