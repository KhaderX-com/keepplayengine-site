import { NextResponse } from "next/server";
import { createApiHandler } from "@/lib/api-gateway";
import { AdminDAL, getUserClient } from "@/lib/dal";
import { deleteSessionSchema } from "@/lib/schemas";

export const GET = createApiHandler(
    { requiredRoles: ["SUPER_ADMIN"] },
    async (_request, { session }) => {
        const client = await getUserClient(session.user.id, session.user.role);
        const { data: sessions, error } = await AdminDAL.getActiveSessions(client);

        if (error) throw error;

        // Filter out excluded audit account (configurable via env) and format response
        const excludedEmail = process.env.EXCLUDED_AUDIT_EMAIL;
        const filteredSessions = sessions
            ?.filter((s: Record<string, unknown>) => {
                if (!excludedEmail) return true;
                const adminUser = s.admin_user as Record<string, unknown> | null;
                return adminUser?.email !== excludedEmail;
            })
            .map((s: Record<string, unknown>) => ({
                ...s,
                user: s.admin_user,
            })) ?? [];

        return NextResponse.json({ sessions: filteredSessions });
    },
);

export const DELETE = createApiHandler(
    { requiredRoles: ["SUPER_ADMIN"], skipContentType: true },
    async (request, { session, ip, userAgent }) => {
        const sessionId = new URL(request.url).searchParams.get("id");
        const parsed = deleteSessionSchema.safeParse({ id: sessionId });
        if (!parsed.success) {
            return NextResponse.json({ error: "Valid session ID required" }, { status: 400 });
        }

        const client = await getUserClient(session.user.id, session.user.role);

        const { error } = await AdminDAL.revokeSession(
            client,
            parsed.data.id,
            `Revoked by ${session.user.email}`,
        );
        if (error) throw error;

        await AdminDAL.logActivity(client, {
            admin_user_id: session.user.id,
            action: "REVOKE_SESSION",
            resource_type: "session",
            resource_id: parsed.data.id,
            description: `Revoked session ${parsed.data.id}`,
            ip_address: ip,
            user_agent: userAgent,
            severity: "warning",
        });

        return NextResponse.json({ success: true });
    },
);
