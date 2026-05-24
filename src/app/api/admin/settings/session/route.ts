import { NextResponse } from "next/server";
import { z } from "zod";
import { createApiHandler } from "@/lib/api-gateway";
import {
    getAdminSessionSettings,
    updateAdminSessionDurationHours,
    MIN_ADMIN_SESSION_DURATION_HOURS,
    MAX_ADMIN_SESSION_DURATION_HOURS,
} from "@/lib/admin-settings";

const sessionSettingsSchema = z.object({
    sessionDurationHours: z
        .number()
        .int()
        .min(MIN_ADMIN_SESSION_DURATION_HOURS)
        .max(MAX_ADMIN_SESSION_DURATION_HOURS),
});

export const GET = createApiHandler(
    { skipContentType: true },
    async () => {
        const settings = await getAdminSessionSettings();
        return NextResponse.json(settings);
    },
);

export const PUT = createApiHandler(
    {
        requiredRoles: ["SUPER_ADMIN"],
        bodySchema: sessionSettingsSchema,
    },
    async (_request, { session, body }) => {
        const settings = await updateAdminSessionDurationHours(
            body.sessionDurationHours,
            session.user.id,
        );

        return NextResponse.json(settings);
    },
);
