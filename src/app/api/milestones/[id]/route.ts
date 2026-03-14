import { NextResponse } from "next/server";
import { updateMilestoneSchema } from "@/lib/schemas";
import { createApiHandler } from "@/lib/api-gateway";
import { getUserClient, MilestonesDAL, AdminDAL } from "@/lib/dal";

// =====================================================
// GET - Fetch single milestone with sub-milestones
// =====================================================
export const GET = createApiHandler({}, async (_req, ctx, routeContext) => {
    const { id } = await routeContext.params;
    const client = await getUserClient(ctx.session.user.id, ctx.session.user.role);

    // Fetch milestone with sub-milestones (including assignee)
    const { data: milestone, error } = await client
        .from("milestones")
        .select("*, sub_milestones(*, assignee:team_members(*))")
        .eq("id", id)
        .single();

    if (error || !milestone) {
        return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
    }

    // Fetch associated task
    const { data: task } = await client
        .from("tasks")
        .select("*, assignee:team_members!tasks_assignee_id_fkey(*), creator:team_members!tasks_created_by_fkey(*)")
        .eq("id", milestone.task_id)
        .single();

    const sortedSubMilestones = milestone.sub_milestones?.sort(
        (a: { major_number: number; minor_number: number }, b: { major_number: number; minor_number: number }) =>
            a.major_number !== b.major_number ? a.major_number - b.major_number : a.minor_number - b.minor_number
    ) || [];

    return NextResponse.json({
        milestone: { ...milestone, task, sub_milestones: sortedSubMilestones },
    });
});

// =====================================================
// PATCH - Update a milestone
// =====================================================
export const PATCH = createApiHandler(
    { bodySchema: updateMilestoneSchema, requiredRoles: ["SUPER_ADMIN", "ADMIN"] },
    async (_req, ctx, routeContext) => {
        const { id } = await routeContext.params;
        const client = await getUserClient(ctx.session.user.id, ctx.session.user.role);

        const { data: milestone, error } = await MilestonesDAL.update(client, id, {
            ...ctx.body,
            updated_at: new Date().toISOString(),
        });

        if (error) {
            return NextResponse.json({ error: "Failed to update milestone" }, { status: 500 });
        }

        await AdminDAL.logActivity(client, {
            admin_user_id: ctx.session.user.id,
            action: "update_milestone",
            resource_type: "milestone",
            resource_id: id,
            description: "Updated milestone",
            changes: ctx.body as Record<string, unknown>,
            ip_address: ctx.ip,
            user_agent: ctx.userAgent,
        });

        return NextResponse.json({ milestone });
    }
);

// =====================================================
// DELETE - Remove milestone (unmark task as milestone)
// =====================================================
export const DELETE = createApiHandler({ requiredRoles: ["SUPER_ADMIN", "ADMIN"] }, async (_req, ctx, routeContext) => {
    const { id } = await routeContext.params;
    const client = await getUserClient(ctx.session.user.id, ctx.session.user.role);

    const { data: milestone, error: fetchError } = await client
        .from("milestones")
        .select("task_id")
        .eq("id", id)
        .single();

    if (fetchError || !milestone) {
        return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
    }

    const { error: deleteError } = await MilestonesDAL.delete(client, id);
    if (deleteError) {
        return NextResponse.json({ error: "Failed to delete milestone" }, { status: 500 });
    }

    // Unmark task as milestone
    await client.from("tasks").update({ is_milestone: false }).eq("id", milestone.task_id);

    await AdminDAL.logActivity(client, {
        admin_user_id: ctx.session.user.id,
        action: "delete_milestone",
        resource_type: "milestone",
        resource_id: id,
        description: "Removed milestone from task",
        ip_address: ctx.ip,
        user_agent: ctx.userAgent,
    });

    return NextResponse.json({ success: true });
});
