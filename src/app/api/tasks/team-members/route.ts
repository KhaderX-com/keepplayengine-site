import { NextResponse } from "next/server";
import { createApiHandler } from "@/lib/api-gateway";
import { TeamMembersDAL, getUserClient } from "@/lib/dal";
import { createTeamMemberSchema } from "@/lib/schemas";

export const GET = createApiHandler(
    { skipContentType: true },
    async (_request, { session }) => {
        const client = await getUserClient(session.user.id, session.user.role);
        const { data: members, error } = await TeamMembersDAL.list(client);
        if (error) throw error;
        return NextResponse.json({ members: members || [] });
    },
);

export const POST = createApiHandler(
    { bodySchema: createTeamMemberSchema, requiredRoles: ["SUPER_ADMIN", "ADMIN"] },
    async (_request, { session, body }) => {
        const client = await getUserClient(session.user.id, session.user.role);
        const { data: member, error } = await TeamMembersDAL.create(client, {
            name: body.name.trim(),
            email: body.email?.trim() || null,
            avatar_url: body.avatar_url || null,
            color: body.color || "#3B82F6",
        });
        if (error) throw error;
        return NextResponse.json({ member }, { status: 201 });
    },
);
