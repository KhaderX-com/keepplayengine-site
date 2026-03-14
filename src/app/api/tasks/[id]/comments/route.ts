import { NextResponse } from "next/server";
import { createApiHandler } from "@/lib/api-gateway";
import { TasksDAL, TeamMembersDAL, getUserClient } from "@/lib/dal";
import { commentSchema } from "@/lib/schemas";

export const GET = createApiHandler(
    { skipContentType: true },
    async (_request, { session }, routeContext) => {
        const { id } = await (routeContext as { params: Promise<{ id: string }> }).params;
        const client = await getUserClient(session.user.id, session.user.role);
        const { data: comments, error } = await TasksDAL.getComments(client, id);
        if (error) throw error;
        return NextResponse.json({ comments: comments || [] });
    },
);

export const POST = createApiHandler(
    { bodySchema: commentSchema },
    async (_request, { session, body }, routeContext) => {
        const { id } = await (routeContext as { params: Promise<{ id: string }> }).params;
        const client = await getUserClient(session.user.id, session.user.role);

        const { data: currentMember } = await TeamMembersDAL.getByEmail(client, session.user.email);

        const { data: comment, error } = await TasksDAL.addComment(client, {
            task_id: id,
            content: body.content.trim(),
            author_id: currentMember?.id || null,
        });
        if (error) throw error;

        await TasksDAL.logActivity(client, {
            task_id: id,
            actor_id: currentMember?.id || null,
            action: "commented",
            metadata: { comment_id: comment.id },
        });

        return NextResponse.json({ comment }, { status: 201 });
    },
);
