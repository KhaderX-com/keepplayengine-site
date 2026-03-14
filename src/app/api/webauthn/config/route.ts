import { NextResponse } from "next/server";
import { createApiHandler } from "@/lib/api-gateway";
import { WebAuthnDAL } from "@/lib/dal";

/**
 * GET /api/webauthn/config
 * Fetch biometric configuration — PUBLIC (needed before login)
 */
export const GET = createApiHandler(
    { skipAuth: true, skipContentType: true, rateLimit: { limit: 100, windowMs: 60_000 } },
    async () => {
        const { data, error } = await WebAuthnDAL.getBiometricConfig();

        if (error) {
            if (error.code === "PGRST116") {
                return NextResponse.json({
                    biometricEnabled: false,
                    allowEnrollment: false,
                    message: "Biometric configuration not initialized. Please contact admin.",
                });
            }
            return NextResponse.json(
                { error: "Failed to fetch biometric configuration" },
                { status: 500 },
            );
        }

        return NextResponse.json({
            biometricEnabled: data.biometric_enabled,
            allowEnrollment: data.allow_enrollment,
            notes: data.notes,
        });
    },
);
