import { NextResponse } from "next/server";
import { createMilestoneSchema } from "@/lib/schemas";
import { createApiHandler } from "@/lib/api-gateway";
import { getUserClient, AdminDAL } from "@/lib/dal";

// =====================================================
// GET - Fetch all milestones with their tasks
// =====================================================
export const GET = createApiHandler({}, async (req, ctx) => {
    const client = await getUserClient(ctx.session.user.id, ctx.session.user.role);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    let query = client
        .from("tasks")
        .select("*, assignee:team_members!tasks_assignee_id_fkey(*), creator:team_members!tasks_created_by_fkey(*)")
        .eq("is_milestone", true)
        .order("created_at", { ascending: false });

    if (status) query = query.eq("status", status);

    const { data: milestoneTasks, error: tasksError } = await query;
    if (tasksError) {
        return NextResponse.json({ error: "Failed to fetch milestones" }, { status: 500 });
    }

    const taskIds = milestoneTasks?.map((t: { id: string }) => t.id) || [];
    if (taskIds.length === 0) {
        return NextResponse.json({ milestones: [] });
    }

    const { data: milestoneData } = await client
        .from("milestones")
        .select("*, sub_milestones(*)")
        .in("task_id", taskIds);

    const milestones = milestoneTasks?.map((task: { id: string }) => {
        const milestone = milestoneData?.find((m: { task_id: string }) => m.task_id === task.id);
        return {
            ...task,
            milestone: milestone || null,
            sub_milestone_count: milestone?.sub_milestones?.length || 0,
            completed_sub_milestones: milestone?.sub_milestones?.filter(
                (sm: { status: string }) => sm.status === "completed"
            ).length || 0,
        };
    }) || [];

    return NextResponse.json({ milestones });
});

// =====================================================
// POST - Create a new milestone for a task
// =====================================================
export const POST = createApiHandler(
    { bodySchema: createMilestoneSchema },
    async (_req, ctx) => {
        const client = await getUserClient(ctx.session.user.id, ctx.session.user.role);
        const body = ctx.body!;

        // Check if task exists
        const { data: task, error: taskError } = await client
            .from("tasks")
            .select("id, title")
            .eq("id", body.task_id)
            .single();

        if (taskError || !task) {
            return NextResponse.json({ error: "Task not found" }, { status: 404 });
        }

        // Mark task as milestone
        const { error: updateError } = await client
            .from("tasks")
            .update({ is_milestone: true })
            .eq("id", body.task_id);

        if (updateError) {
            return NextResponse.json({ error: "Failed to mark task as milestone" }, { status: 500 });
        }

        // Create milestone record
        const { data: milestone, error: milestoneError } = await client
            .from("milestones")
            .insert({
                task_id: body.task_id,
                description: body.description || null,
                target_date: body.target_date || null,
                status: "not_started",
                progress_percentage: 0,
            })
            .select()
            .single();

        if (milestoneError) {
            // Revert task milestone status
            await client.from("tasks").update({ is_milestone: false }).eq("id", body.task_id);
            return NextResponse.json({ error: "Failed to create milestone" }, { status: 500 });
        }

        await AdminDAL.logActivity(client, {
            admin_user_id: ctx.session.user.id,
            action: "create_milestone",
            resource_type: "milestone",
            resource_id: milestone.id,
            description: `Created milestone for task: ${task.title}`,
            ip_address: ctx.ip,
            user_agent: ctx.userAgent,
        });

        return NextResponse.json({ milestone }, { status: 201 });
    }
);
