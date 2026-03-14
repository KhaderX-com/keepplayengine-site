import { NextResponse } from "next/server";
import { createApiHandler } from "@/lib/api-gateway";
import { WebAuthnDAL } from "@/lib/dal";
import { webauthnEmailSchema } from "@/lib/schemas";

/**
 * POST /api/webauthn/check-enrollment
 * Check if a user has biometric authentication enrolled — PUBLIC (pre-login)
 */
export const POST = createApiHandler(
    {
        skipAuth: true,
        bodySchema: webauthnEmailSchema,
        rateLimit: { limit: 30, windowMs: 60_000 },
    },
    async (_req, ctx) => {
        // Always delay to prevent timing-based enumeration
        const start = Date.now();
        const result = await WebAuthnDAL.checkEnrollment(ctx.body.email);
        const elapsed = Date.now() - start;
        if (elapsed < 200) await new Promise(r => setTimeout(r, 200 - elapsed));

        // Return biometricEnabled from global config only; never reveal per-user enrollment
        return NextResponse.json({
            enrolled: false,
            biometricEnabled: result.biometricEnabled,
        });
    },
);
