import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import type { UpdateTaskRequest } from '@/types/tasks';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// =====================================================
// GET - Fetch single task with details
// =====================================================
export async function GET(request: Request, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // Fetch task with relations
        const { data: task, error } = await supabaseAdmin
            .from('tasks')
            .select(`
                *,
                assignee:team_members!tasks_assignee_id_fkey(*),
                creator:team_members!tasks_created_by_fkey(*)
            `)
            .eq('id', id)
            .single();

        if (error || !task) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        // Fetch labels
        const { data: labelAssignments } = await supabaseAdmin
            .from('task_label_assignments')
            .select(`label:task_labels(*)`)
            .eq('task_id', id);

        // Fetch subtasks
        const { data: subtasks } = await supabaseAdmin
            .from('tasks')
            .select(`
                *,
                assignee:team_members!tasks_assignee_id_fkey(*)
            `)
            .eq('parent_task_id', id)
            .order('position', { ascending: true });

        // Fetch comments
        const { data: comments } = await supabaseAdmin
            .from('task_comments')
            .select(`
                *,
                author:team_members(*)
            `)
            .eq('task_id', id)
            .order('created_at', { ascending: true });

        // Fetch activity log
        const { data: activities } = await supabaseAdmin
            .from('task_activity_log')
            .select(`
                *,
                actor:team_members(*)
            `)
            .eq('task_id', id)
            .order('created_at', { ascending: false })
            .limit(20);

        return NextResponse.json({
            task: {
                ...task,
                labels: labelAssignments?.map(la => la.label) || [],
                subtasks: subtasks || [],
                subtask_count: subtasks?.length || 0,
                completed_subtask_count: subtasks?.filter(s => s.status === 'done').length || 0,
            },
            comments: comments || [],
            activities: activities || [],
        });
    } catch (error) {
        console.error('Task GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// =====================================================
// PATCH - Update a task
// =====================================================
export async function PATCH(request: Request, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body: UpdateTaskRequest = await request.json();

        // Get current task for comparison
        const { data: currentTask } = await supabaseAdmin
            .from('tasks')
            .select('*')
            .eq('id', id)
            .single();

        if (!currentTask) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        // Get current user
        const { data: currentMember } = await supabaseAdmin
            .from('team_members')
            .select('id')
            .eq('email', session.user?.email)
            .single();

        // Prepare update object
        const updateData: Record<string, unknown> = {};
        const activityLogs: Array<{
            task_id: string;
            actor_id: string | null;
            action: string;
            field_changed: string;
            old_value: string | null;
            new_value: string | null;
        }> = [];

        // Track changes
        const fields = ['title', 'description', 'status', 'priority', 'assignee_id', 'position', 'due_date', 'estimated_hours', 'actual_hours', 'color'] as const;

        for (const field of fields) {
            if (body[field] !== undefined && body[field] !== currentTask[field]) {
                updateData[field] = body[field];

                activityLogs.push({
                    task_id: id,
                    actor_id: currentMember?.id || null,
                    action: field === 'status' ? 'status_changed' : 'updated',
                    field_changed: field,
                    old_value: currentTask[field]?.toString() || null,
                    new_value: body[field]?.toString() || null,
                });
            }
        }

        // Update task
        if (Object.keys(updateData).length > 0) {
            const { data: task, error } = await supabaseAdmin
                .from('tasks')
                .update(updateData)
                .eq('id', id)
                .select(`
                    *,
                    assignee:team_members!tasks_assignee_id_fkey(*),
                    creator:team_members!tasks_created_by_fkey(*)
                `)
                .single();

            if (error) {
                console.error('Error updating task:', error);
                return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
            }

            // Log activities
            if (activityLogs.length > 0) {
                await supabaseAdmin.from('task_activity_log').insert(activityLogs);
            }

            // Update labels if provided
            if (body.label_ids !== undefined) {
                // Remove existing labels
                await supabaseAdmin
                    .from('task_label_assignments')
                    .delete()
                    .eq('task_id', id);

                // Add new labels
                if (body.label_ids.length > 0) {
                    await supabaseAdmin
                        .from('task_label_assignments')
                        .insert(
                            body.label_ids.map(labelId => ({
                                task_id: id,
                                label_id: labelId,
                            }))
                        );
                }
            }

            // Fetch labels for response
            const { data: labelAssignments } = await supabaseAdmin
                .from('task_label_assignments')
                .select(`label:task_labels(*)`)
                .eq('task_id', id);

            return NextResponse.json({
                task: {
                    ...task,
                    labels: labelAssignments?.map(la => la.label) || [],
                },
            });
        }

        return NextResponse.json({ task: currentTask });
    } catch (error) {
        console.error('Task PATCH error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// =====================================================
// DELETE - Delete a task
// =====================================================
export async function DELETE(request: Request, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const { error } = await supabaseAdmin
            .from('tasks')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting task:', error);
            return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Task DELETE error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
