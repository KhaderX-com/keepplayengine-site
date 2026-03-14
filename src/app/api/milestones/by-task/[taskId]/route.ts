import { NextResponse } from "next/server";
import { createApiHandler } from "@/lib/api-gateway";
import { getUserClient, TasksDAL } from "@/lib/dal";

// =====================================================
// GET - Fetch milestone by task ID
// =====================================================
export const GET = createApiHandler({}, async (_req, ctx, routeContext) => {
    const { taskId } = await routeContext.params;
    const client = await getUserClient(ctx.session.user.id, ctx.session.user.role);

    // Fetch milestone for this task with sub-milestones
    const { data: milestone, error } = await client
        .from("milestones")
        .select("*, sub_milestones(*, assignee:team_members(*))")
        .eq("task_id", taskId)
        .maybeSingle();

    if (error) {
        return NextResponse.json({ error: "Failed to fetch milestone" }, { status: 500 });
    }

    // No milestone for this task — valid state
    if (!milestone) {
        return NextResponse.json({ milestone: null });
    }

    const { data: task } = await TasksDAL.getById(client, taskId);

    const sortedSubMilestones = milestone.sub_milestones?.sort(
        (a: { major_number: number; minor_number: number }, b: { major_number: number; minor_number: number }) =>
            a.major_number !== b.major_number ? a.major_number - b.major_number : a.minor_number - b.minor_number
    ) || [];

    return NextResponse.json({
        milestone: { ...milestone, task, sub_milestones: sortedSubMilestones },
    });
});
