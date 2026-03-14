import { NextResponse } from "next/server";
import { createApiHandler } from "@/lib/api-gateway";
import { TasksDAL, TeamMembersDAL, AdminDAL, getUserClient } from "@/lib/dal";
import type { TaskFilters } from "@/types/tasks";
import { createTaskSchema } from "@/lib/schemas";

export const GET = createApiHandler(
    { skipContentType: true },
    async (request, { session }) => {
        const client = await getUserClient(session.user.id, session.user.role);
        const { searchParams } = new URL(request.url);

        const filters: TaskFilters = {
            status: (searchParams.get("status") as TaskFilters["status"]) || undefined,
            priority: (searchParams.get("priority") as TaskFilters["priority"]) || undefined,
            assignee_id: searchParams.get("assignee_id") || undefined,
            label_id: searchParams.get("label_id") || undefined,
            parent_task_id: searchParams.get("parent_task_id") || undefined,
            search: searchParams.get("search") || undefined,
        };
        const onlyTopLevel = searchParams.get("only_top_level") !== "false";

        const { data: tasks, error } = await TasksDAL.list(client, { ...filters, onlyTopLevel });
        if (error) throw error;

        const taskIds = tasks?.map((t) => t.id) || [];
        if (taskIds.length > 0) {
            const [labels, assignees, subtasks] = await Promise.all([
                TasksDAL.getLabels(client, taskIds),
                TasksDAL.getAssignees(client, taskIds),
                TasksDAL.getSubtasks(client, taskIds),
            ]);

            const tasksWithRelations = tasks?.map((task) => {
                const taskLabels =
                    labels.data?.filter((la) => la.task_id === task.id).map((la) => la.label) || [];
                const taskAssignees =
                    assignees.data?.filter((a) => a.task_id === task.id).map((a) => a.team_member) || [];
                const taskSubtasks = subtasks.data?.filter((s) => s.parent_task_id === task.id) || [];

                return {
                    ...task,
                    labels: taskLabels,
                    assignees: taskAssignees,
                    subtasks: taskSubtasks,
                    subtask_count: taskSubtasks.length,
                    completed_subtask_count: taskSubtasks.filter((s) => s.status === "done").length,
                };
            });

            return NextResponse.json({ tasks: tasksWithRelations });
        }

        return NextResponse.json({ tasks: tasks || [] });
    },
);

export const POST = createApiHandler(
    { bodySchema: createTaskSchema },
    async (_request, { session, body, ip, userAgent }) => {
        const client = await getUserClient(session.user.id, session.user.role);

        // Get the current user's team member record
        const { data: currentMember } = await TeamMembersDAL.getByEmail(client, session.user.email);
        const adminUserId = currentMember?.admin_user_id || session.user.id;

        // Get max position
        const { data: maxPosResult } = await TasksDAL.getMaxPosition(
            client,
            body.status || "todo",
            body.parent_task_id || null,
        );
        const newPosition = (maxPosResult?.position ?? -1) + 1;

        const defaultAssigneeId =
            body.assignee_id !== undefined ? body.assignee_id : currentMember?.id || null;

        const { data: task, error } = await TasksDAL.create(client, {
            title: body.title.trim(),
            description: body.description?.trim() || null,
            status: body.status || "todo",
            priority: body.priority || "medium",
            assignee_id: defaultAssigneeId,
            created_by: currentMember?.id || null,
            parent_task_id: body.parent_task_id || null,
            position: newPosition,
            due_date: body.due_date || null,
            estimated_hours: body.estimated_hours || null,
            color: body.color || null,
            is_milestone: body.is_milestone || false,
        });
        if (error) throw error;

        // Assign multiple assignees or default
        if (body.assignee_ids?.length) {
            await TasksDAL.setAssignees(client, task.id, body.assignee_ids);
        } else if (defaultAssigneeId) {
            await TasksDAL.setAssignees(client, task.id, [defaultAssigneeId]);
        }

        // Assign labels
        if (body.label_ids?.length) {
            await TasksDAL.assignLabels(client, task.id, body.label_ids);
        }

        // Log task activity
        await TasksDAL.logActivity(client, {
            task_id: task.id,
            actor_id: currentMember?.id || null,
            admin_user_id: adminUserId,
            action: "created",
            metadata: { title: body.title },
        });

        // Log admin activity
        await AdminDAL.logActivity(client, {
            admin_user_id: session.user.id,
            action: "CREATE_TASK",
            resource_type: "task",
            resource_id: task.id,
            description: `Created task: "${task.title}"`,
            ip_address: ip,
            user_agent: userAgent,
            changes: { title: task.title, status: task.status, priority: task.priority },
        });

        return NextResponse.json({ task }, { status: 201 });
    },
);
