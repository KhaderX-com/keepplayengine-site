import { NextResponse } from "next/server";
import { createApiHandler } from "@/lib/api-gateway";
import { getUserClient, TasksDAL, TeamMembersDAL, MilestonesDAL, AdminDAL } from "@/lib/dal";
import { updateTaskSchema } from "@/lib/schemas";

// =====================================================
// GET - Fetch single task with details
// =====================================================
export const GET = createApiHandler({}, async (_req, ctx, routeContext) => {
    const { id } = await routeContext.params;
    const client = await getUserClient(ctx.session.user.id, ctx.session.user.role);

    const { data: task, error } = await TasksDAL.getById(client, id);
    if (error || !task) {
        return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const [
        { data: labelAssignments },
        { data: subtasks },
        { data: comments },
        { data: activities },
    ] = await Promise.all([
        TasksDAL.getLabels(client, [id]),
        TasksDAL.getSubtasks(client, [id]),
        TasksDAL.getComments(client, id),
        TasksDAL.getActivityLog(client, id),
    ]);

    return NextResponse.json({
        task: {
            ...task,
            labels: labelAssignments?.map((la: { label: unknown }) => la.label) || [],
            subtasks: subtasks || [],
            subtask_count: subtasks?.length || 0,
            completed_subtask_count: subtasks?.filter((s: { status: string }) => s.status === "done").length || 0,
        },
        comments: comments || [],
        activities: activities || [],
    });
});

// =====================================================
// PATCH - Update a task
// =====================================================
export const PATCH = createApiHandler(
    { bodySchema: updateTaskSchema, requiredRoles: ["SUPER_ADMIN", "ADMIN"] },
    async (_req, ctx, routeContext) => {
        const { id } = await routeContext.params;
        const client = await getUserClient(ctx.session.user.id, ctx.session.user.role);
        const body = ctx.body!;

        // Get current task for comparison
        const { data: currentTask } = await TasksDAL.getById(client, id);
        if (!currentTask) {
            return NextResponse.json({ error: "Task not found" }, { status: 404 });
        }

        // Get current team member for actor_id
        const { data: currentMember } = await TeamMembersDAL.getByEmail(client, ctx.session.user.email!);
        const adminUserId = ctx.session.user.id;

        // Track changes
        const updateData: Record<string, unknown> = {};
        const activityLogs: Array<{
            task_id: string;
            actor_id: string | null;
            admin_user_id: string | null;
            action: string;
            field_changed: string;
            old_value: string | null;
            new_value: string | null;
        }> = [];

        const fields = ["title", "description", "status", "priority", "assignee_id", "position", "due_date", "estimated_hours", "actual_hours", "color", "is_milestone"] as const;

        for (const field of fields) {
            if (body[field] !== undefined && body[field] !== currentTask[field]) {
                updateData[field] = body[field];
                activityLogs.push({
                    task_id: id,
                    actor_id: currentMember?.id || null,
                    admin_user_id: adminUserId || null,
                    action: field === "status" ? "status_changed" : "updated",
                    field_changed: field,
                    old_value: currentTask[field]?.toString() || null,
                    new_value: body[field]?.toString() || null,
                });
            }
        }

        if (Object.keys(updateData).length > 0) {
            const { data: task, error } = await TasksDAL.update(client, id, updateData);
            if (error) {
                return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
            }

            if (activityLogs.length > 0) {
                await TasksDAL.logActivityBatch(client, activityLogs);
            }

            const changesDescription = activityLogs
                .map((l) => `${l.field_changed}: ${l.old_value || "empty"} → ${l.new_value || "empty"}`)
                .join(", ");

            await AdminDAL.logActivity(client, {
                admin_user_id: adminUserId,
                action: "UPDATE_TASK",
                resource_type: "task",
                resource_id: id,
                description: `Updated task: "${task!.title}" (${changesDescription})`,
                changes: Object.fromEntries(
                    activityLogs.map((l) => [l.field_changed, { old: l.old_value, new: l.new_value }])
                ),
                ip_address: ctx.ip,
                user_agent: ctx.userAgent,
            });

            // Update labels if provided
            if (body.label_ids !== undefined) {
                await TasksDAL.setLabels(client, id, body.label_ids);
            }

            const { data: labelAssignments } = await TasksDAL.getLabels(client, [id]);
            return NextResponse.json({
                task: {
                    ...task,
                    labels: labelAssignments?.map((la: { label: unknown }) => la.label) || [],
                },
            });
        }

        return NextResponse.json({ task: currentTask });
    }
);

// =====================================================
// DELETE - Delete a task (and associated milestones/sub-milestones if it's a milestone)
// =====================================================
export const DELETE = createApiHandler({ requiredRoles: ["SUPER_ADMIN", "ADMIN"] }, async (_req, ctx, routeContext) => {
    const { id } = await routeContext.params;
    const client = await getUserClient(ctx.session.user.id, ctx.session.user.role);

    // Get task details before deletion for logging
    const { data: taskToDelete } = await client
        .from("tasks")
        .select("title, is_milestone")
        .eq("id", id)
        .single();

    const taskTitle = taskToDelete?.title || "Unknown Task";
    const isMilestone = taskToDelete?.is_milestone || false;

    let deletedSubMilestones = 0;
    let deletedMilestones = 0;

    if (isMilestone) {
        const { data: milestone } = await MilestonesDAL.getByTaskId(client, id);
        if (milestone) {
            const { count } = await client
                .from("sub_milestones")
                .select("*", { count: "exact", head: true })
                .eq("milestone_id", milestone.id);

            deletedSubMilestones = count || 0;

            const { error: subErr } = await client
                .from("sub_milestones")
                .delete()
                .eq("milestone_id", milestone.id);
            if (subErr) {
                return NextResponse.json({ error: "Failed to delete sub-milestones" }, { status: 500 });
            }

            const { error: msErr } = await MilestonesDAL.delete(client, milestone.id);
            if (msErr) {
                return NextResponse.json({ error: "Failed to delete milestone" }, { status: 500 });
            }
            deletedMilestones = 1;
        }
    }

    const { error } = await TasksDAL.delete(client, id);
    if (error) {
        return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
    }

    const logDescription = isMilestone
        ? `Deleted milestone task: "${taskTitle}" (including ${deletedMilestones} milestone and ${deletedSubMilestones} sub-milestones)`
        : `Deleted task: "${taskTitle}"`;

    await AdminDAL.logActivity(client, {
        admin_user_id: ctx.session.user.id,
        action: "DELETE_TASK",
        resource_type: "task",
        resource_id: id,
        description: logDescription,
        severity: "warning",
        ip_address: ctx.ip,
        user_agent: ctx.userAgent,
    });

    return NextResponse.json({ success: true, deletedMilestones, deletedSubMilestones });
});
