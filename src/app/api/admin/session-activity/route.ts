import { NextResponse } from "next/server";
import { createApiHandler } from "@/lib/api-gateway";
import { AdminDAL, getUserClient } from "@/lib/dal";

export const POST = createApiHandler(
    { skipContentType: true },
    async (_request, { session }) => {
        // Skip excluded audit account (configurable via env)
        const excludedEmail = process.env.EXCLUDED_AUDIT_EMAIL;
        if (excludedEmail && session.user.email === excludedEmail) {
            return NextResponse.json({ success: true, skipped: true });
        }

        const client = await getUserClient(session.user.id, session.user.role);
        const { error } = await AdminDAL.updateSessionActivity(client, session.user.id);

        if (error) {
            console.error("Error updating session activity:", error);
            return NextResponse.json({ error: "Failed to update session" }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    },
);

export const DELETE = createApiHandler(
    { requiredRoles: ["SUPER_ADMIN"], skipContentType: true },
    async (_request, { session }) => {
        const client = await getUserClient(session.user.id, session.user.role);
        const { error, count } = await AdminDAL.deleteExpiredSessions(client);
        if (error) throw error;
        return NextResponse.json({ success: true, deletedCount: count || 0 });
    },
);
