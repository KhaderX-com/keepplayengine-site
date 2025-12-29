import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserBiometricDevices, removeBiometricDevice } from "@/lib/webauthn";

/**
 * GET /api/webauthn/devices
 * Get user's registered biometric devices
 */
export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const devices = await getUserBiometricDevices(session.user.id);

        return NextResponse.json({
            success: true,
            devices,
        });
    } catch (error) {
        const err = error as Error;
        console.error("Error fetching devices:", err);
        return NextResponse.json(
            { error: "Failed to fetch devices", details: err.message },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/webauthn/devices
 * Remove a biometric device
 */
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { credentialId } = await request.json();

        if (!credentialId) {
            return NextResponse.json(
                { error: "Credential ID required" },
                { status: 400 }
            );
        }

        await removeBiometricDevice(session.user.id, credentialId);

        return NextResponse.json({
            success: true,
            message: "Device removed successfully",
        });
    } catch (error) {
        const err = error as Error;
        console.error("Error removing device:", err);
        return NextResponse.json(
            { error: "Failed to remove device", details: err.message },
            { status: 500 }
        );
    }
}
