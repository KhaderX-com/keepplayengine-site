import { NextResponse } from "next/server";
import { createApiHandler } from "@/lib/api-gateway";
import { getUserClient } from "@/lib/dal";

export const GET = createApiHandler(
    { skipContentType: true },
    async (_request, { session }) => {
        const client = await getUserClient(session.user.id, session.user.role);

        // Get all top-level tasks (not subtasks)
        const { data: tasks, error: tasksError } = await client
            .from("tasks")
            .select("id, status, assignee_id, due_date")
            .is("parent_task_id", null);

        if (tasksError) throw tasksError;

        // Get task assignees from junction table
        const { data: taskAssignees } = await client
            .from("task_assignees")
            .select("task_id, team_member_id");

        // Get team members
        const { data: members } = await client
            .from("team_members")
            .select("*")
            .eq("is_active", true);

        const now = new Date();

        const stats = {
            total: tasks?.length || 0,
            todo: tasks?.filter((t) => t.status === "todo").length || 0,
            in_progress: tasks?.filter((t) => t.status === "in_progress").length || 0,
            done: tasks?.filter((t) => t.status === "done").length || 0,
            overdue: tasks?.filter(
                (t) => t.due_date && new Date(t.due_date) < now && t.status !== "done",
            ).length || 0,
            by_assignee: members?.map((member) => {
                const memberTaskIds =
                    taskAssignees
                        ?.filter((ta) => ta.team_member_id === member.id)
                        .map((ta) => ta.task_id) || [];
                const legacyTaskIds =
                    tasks?.filter((t) => t.assignee_id === member.id).map((t) => t.id) || [];
                const allTaskIds = [...new Set([...memberTaskIds, ...legacyTaskIds])];
                const memberTasks = tasks?.filter((t) => allTaskIds.includes(t.id)) || [];

                return {
                    member,
                    total: memberTasks.length,
                    completed: memberTasks.filter((t) => t.status === "done").length,
                };
            }) || [],
        };

        return NextResponse.json({ stats });
    },
);
