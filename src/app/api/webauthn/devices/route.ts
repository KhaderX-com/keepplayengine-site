import { NextRequest, NextResponse } from "next/server";
import { createApiHandler } from "@/lib/api-gateway";
import { getUserBiometricDevices, removeBiometricDevice } from "@/lib/webauthn";
import { deleteDeviceSchema } from "@/lib/schemas";

/**
 * GET /api/webauthn/devices — list registered biometric devices
 */
export const GET = createApiHandler(
    { skipContentType: true },
    async (_req, ctx) => {
        const devices = await getUserBiometricDevices(ctx.session.user.id);
        return NextResponse.json({ success: true, devices });
    },
);

/**
 * DELETE /api/webauthn/devices — remove a biometric device
 */
export const DELETE = createApiHandler(
    { bodySchema: deleteDeviceSchema },
    async (_req: NextRequest, ctx) => {
        await removeBiometricDevice(ctx.session.user.id, ctx.body.credentialId);
        return NextResponse.json({ success: true, message: "Device removed successfully" });
    },
);
