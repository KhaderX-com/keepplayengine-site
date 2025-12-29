import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
    generateRegistrationOptions,
    generateAuthenticationOptions,
    verifyRegistrationResponse,
    verifyAuthenticationResponse,
    getUserBiometricDevices,
    removeBiometricDevice,
    hasBiometricCredentials,
} from "@/lib/webauthn";

/**
 * POST /api/webauthn/register/options
 * Generate registration options for enrolling a biometric credential
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

        const { deviceName } = await request.json();

        const { options, challenge } = await generateRegistrationOptions(
            session.user.id,
            session.user.name || session.user.email || "Admin",
            session.user.email || "admin@keepplayengine.com"
        );

        // Store challenge in session or temporary storage
        // For production, use Redis or database
        const response = NextResponse.json({
            success: true,
            options: {
                ...options,
                challenge: Array.from(options.challenge instanceof ArrayBuffer ? new Uint8Array(options.challenge) : options.challenge),
                user: {
                    ...options.user,
                    id: Array.from(options.user.id instanceof ArrayBuffer ? new Uint8Array(options.user.id) : options.user.id),
                },
                excludeCredentials: options.excludeCredentials?.map((cred) => ({
                    ...cred,
                    id: Array.from(cred.id instanceof ArrayBuffer ? new Uint8Array(cred.id) : cred.id),
                })),
            },
            challenge,
        });

        // Store challenge in cookie for verification
        response.cookies.set("webauthn_challenge", challenge, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 300, // 5 minutes
        });

        return response;
    } catch (error: any) {
        console.error("Error generating registration options:", error);
        return NextResponse.json(
            { error: "Failed to generate registration options", details: error.message },
            { status: 500 }
        );
    }
}
