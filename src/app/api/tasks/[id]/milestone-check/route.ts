import { NextResponse } from "next/server";
import { createApiHandler } from "@/lib/api-gateway";
import { MilestonesDAL, getUserClient } from "@/lib/dal";

export const GET = createApiHandler(
    { skipContentType: true },
    async (_request, { session }, routeContext) => {
        const { id } = await (routeContext as { params: Promise<{ id: string }> }).params;
        const client = await getUserClient(session.user.id, session.user.role);

        const { data: task, error: taskError } = await client
            .from("tasks")
            .select("is_milestone, title")
            .eq("id", id)
            .single();

        if (taskError || !task) {
            return NextResponse.json({ error: "Task not found" }, { status: 404 });
        }

        if (!task.is_milestone) {
            return NextResponse.json({
                hasMilestones: false,
                milestoneCount: 0,
                subMilestoneCount: 0,
                taskTitle: task.title,
            });
        }

        const { data: milestone } = await MilestonesDAL.getByTaskId(client, id);

        if (!milestone) {
            return NextResponse.json({
                hasMilestones: false,
                milestoneCount: 0,
                subMilestoneCount: 0,
                taskTitle: task.title,
            });
        }

        const { count: subMilestoneCount, error: subError } = await client
            .from("sub_milestones")
            .select("*", { count: "exact", head: true })
            .eq("milestone_id", milestone.id);

        if (subError) throw subError;

        return NextResponse.json({
            hasMilestones: true,
            milestoneCount: 1,
            subMilestoneCount: subMilestoneCount || 0,
            taskTitle: task.title,
        });
    },
);
