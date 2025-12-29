import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
    generateRegistrationOptions,
} from "@/lib/webauthn";

/**
 * POST /api/webauthn/register/options
 * Generate registration options for enrolling a biometric credential
 */
export async function POST() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Only allow admins to register biometric
        if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

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
                challenge: Array.from(new Uint8Array(options.challenge as ArrayBuffer)),
                user: {
                    ...options.user,
                    id: Array.from(new Uint8Array(options.user.id as ArrayBuffer)),
                },
                excludeCredentials: options.excludeCredentials?.map((cred) => ({
                    ...cred,
                    id: Array.from(new Uint8Array(cred.id as ArrayBuffer)),
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
    } catch (error) {
        const err = error as Error;
        console.error("Error generating registration options:", err);
        return NextResponse.json(
            { error: "Failed to generate registration options", details: err.message },
            { status: 500 }
        );
    }
}
