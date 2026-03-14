import { NextRequest, NextResponse } from "next/server";
import { createApiHandler } from "@/lib/api-gateway";
import { AdminDAL } from "@/lib/dal";
import { getClientIP, getDeviceInfo } from "@/lib/request-utils";
import bcrypt from "bcryptjs";
import { credentialsSchema } from "@/lib/schemas";

/**
 * POST /api/auth/verify-credentials
 * Verify credentials WITHOUT creating a session (2FA pre-check) — PUBLIC
 */
export const POST = createApiHandler(
    {
        skipAuth: true,
        bodySchema: credentialsSchema,
        rateLimit: { limit: 10, windowMs: 60_000 },
    },
    async (req: NextRequest, ctx) => {
        const startTime = Date.now();
        const { email, password } = ctx.body;

        // M13: Helper to ensure constant-time response (prevents timing-based enumeration)
        async function respond(body: object, status: number) {
            const elapsed = Date.now() - startTime;
            const minDelay = 200; // milliseconds
            if (elapsed < minDelay) {
                await new Promise((r) => setTimeout(r, minDelay - elapsed));
            }
            return NextResponse.json(body, { status });
        }

        const { data: admin, error: adminError } = await AdminDAL.getAdminUserByEmail(email);
        if (adminError || !admin || !admin.is_active || !admin.password_hash) {
            // Perform a dummy bcrypt compare to consume similar time as a real compare
            await bcrypt.compare(password, "$2a$14$0000000000000000000000uT3a.Gh/N1SDdHOb5OQzQGlLCk6EqIO");
            return respond(
                { error: "Invalid credentials", valid: false },
                401,
            );
        }

        // Check if account is locked — return generic error to prevent info disclosure
        if (admin.is_locked && admin.locked_until && new Date(admin.locked_until) > new Date()) {
            return respond(
                { error: "Invalid credentials", valid: false },
                401,
            );
        }

        const passwordValid = await bcrypt.compare(password, admin.password_hash);

        if (!passwordValid) {
            const ipAddress = getClientIP(req);
            const userAgent = req.headers.get("user-agent") || null;
            const deviceInfo = getDeviceInfo(userAgent);

            await AdminDAL.recordLoginAttempt({
                email,
                ip_address: ipAddress,
                user_agent: userAgent,
                success: false,
                admin_user_id: null,
                attempt_type: "password",
                failure_reason: "Invalid password",
                device_info: deviceInfo,
            });

            return respond(
                { error: "Invalid credentials", valid: false },
                401,
            );
        }

        return respond({
            valid: true,
            userId: admin.id,
            email: admin.email,
            name: admin.name,
        }, 200);
    },
);
