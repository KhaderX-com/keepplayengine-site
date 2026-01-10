import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import type { CreateTaskRequest, TaskFilters } from '@/types/tasks';

// =====================================================
// GET - Fetch tasks with filters
// =====================================================
export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);

        // Parse filters
        const filters: TaskFilters = {
            status: searchParams.get('status') as TaskFilters['status'] || undefined,
            priority: searchParams.get('priority') as TaskFilters['priority'] || undefined,
            assignee_id: searchParams.get('assignee_id') || undefined,
            label_id: searchParams.get('label_id') || undefined,
            parent_task_id: searchParams.get('parent_task_id') || undefined,
            search: searchParams.get('search') || undefined,
        };

        const onlyTopLevel = searchParams.get('only_top_level') !== 'false'; // Default true

        // Build query
        let query = supabaseAdmin
            .from('tasks')
            .select(`
                *,
                assignee:team_members!tasks_assignee_id_fkey(*),
                creator:team_members!tasks_created_by_fkey(*)
            `)
            .order('position', { ascending: true })
            .order('created_at', { ascending: false });

        // Apply filters
        if (filters.status) {
            if (Array.isArray(filters.status)) {
                query = query.in('status', filters.status);
            } else {
                query = query.eq('status', filters.status);
            }
        }

        if (filters.priority) {
            if (Array.isArray(filters.priority)) {
                query = query.in('priority', filters.priority);
            } else {
                query = query.eq('priority', filters.priority);
            }
        }

        if (filters.assignee_id) {
            query = query.eq('assignee_id', filters.assignee_id);
        }

        if (filters.search) {
            query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
        }

        if (onlyTopLevel && !filters.parent_task_id) {
            query = query.is('parent_task_id', null);
        } else if (filters.parent_task_id) {
            query = query.eq('parent_task_id', filters.parent_task_id);
        }

        const { data: tasks, error } = await query;

        if (error) {
            console.error('Error fetching tasks:', error);
            return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
        }

        // Fetch labels and assignees for each task
        const taskIds = tasks?.map(t => t.id) || [];
        if (taskIds.length > 0) {
            const { data: labelAssignments } = await supabaseAdmin
                .from('task_label_assignments')
                .select(`
                    task_id,
                    label:task_labels(*)
                `)
                .in('task_id', taskIds);

            // Fetch multiple assignees
            const { data: assigneeData } = await supabaseAdmin
                .from('task_assignees')
                .select(`
                    task_id,
                    team_member:team_members(*)
                `)
                .in('task_id', taskIds);

            // Fetch subtasks with full details
            const { data: subtasksData } = await supabaseAdmin
                .from('tasks')
                .select(`
                    *,
                    assignee:team_members!tasks_assignee_id_fkey(*)
                `)
                .in('parent_task_id', taskIds)
                .order('position', { ascending: true });

            // Attach labels, assignees, and subtasks to tasks
            const tasksWithLabels = tasks?.map(task => {
                const taskLabels = labelAssignments
                    ?.filter(la => la.task_id === task.id)
                    .map(la => la.label) || [];

                const taskAssignees = assigneeData
                    ?.filter(a => a.task_id === task.id)
                    .map(a => a.team_member) || [];

                const taskSubtasks = subtasksData?.filter(s => s.parent_task_id === task.id) || [];
                const completedSubtasks = taskSubtasks.filter(s => s.status === 'done');

                return {
                    ...task,
                    labels: taskLabels,
                    assignees: taskAssignees,
                    subtasks: taskSubtasks,
                    subtask_count: taskSubtasks.length,
                    completed_subtask_count: completedSubtasks.length,
                };
            });

            return NextResponse.json({ tasks: tasksWithLabels });
        }

        return NextResponse.json({ tasks: tasks || [] });
    } catch (error) {
        console.error('Tasks GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// =====================================================
// POST - Create a new task
// =====================================================
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body: CreateTaskRequest = await request.json();

        if (!body.title?.trim()) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 });
        }

        // Get the current user's team member ID
        const { data: currentMember } = await supabaseAdmin
            .from('team_members')
            .select('id')
            .eq('email', session.user?.email)
            .single();

        // Get max position for the status
        const { data: maxPosResult } = await supabaseAdmin
            .from('tasks')
            .select('position')
            .eq('status', body.status || 'todo')
            .is('parent_task_id', body.parent_task_id || null)
            .order('position', { ascending: false })
            .limit(1)
            .single();

        const newPosition = (maxPosResult?.position ?? -1) + 1;

        // Auto-assign to creator if no assignee specified
        // If Khader creates task -> defaults to Khader
        // If Amro creates task -> defaults to Amro
        const defaultAssigneeId = body.assignee_id !== undefined
            ? body.assignee_id
            : currentMember?.id || null;

        // Create task
        const { data: task, error } = await supabaseAdmin
            .from('tasks')
            .insert({
                title: body.title.trim(),
                description: body.description?.trim() || null,
                status: body.status || 'todo',
                priority: body.priority || 'medium',
                assignee_id: defaultAssigneeId,
                created_by: currentMember?.id || null,
                parent_task_id: body.parent_task_id || null,
                position: newPosition,
                due_date: body.due_date || null,
                estimated_hours: body.estimated_hours || null,
                color: body.color || null,
            })
            .select(`
                *,
                assignee:team_members!tasks_assignee_id_fkey(*),
                creator:team_members!tasks_created_by_fkey(*)
            `)
            .single();

        if (error) {
            console.error('Error creating task:', error);
            return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
        }

        // Assign multiple assignees if provided via assignee_ids
        if (body.assignee_ids?.length) {
            await supabaseAdmin
                .from('task_assignees')
                .insert(
                    body.assignee_ids.map(assigneeId => ({
                        task_id: task.id,
                        team_member_id: assigneeId,
                    }))
                );
        } else if (defaultAssigneeId) {
            // Auto-assign to creator or explicitly specified assignee
            await supabaseAdmin
                .from('task_assignees')
                .insert({
                    task_id: task.id,
                    team_member_id: defaultAssigneeId,
                });
        }

        // Assign labels if provided
        if (body.label_ids?.length) {
            await supabaseAdmin
                .from('task_label_assignments')
                .insert(
                    body.label_ids.map(labelId => ({
                        task_id: task.id,
                        label_id: labelId,
                    }))
                );
        }

        // Log activity
        await supabaseAdmin.from('task_activity_log').insert({
            task_id: task.id,
            actor_id: currentMember?.id || null,
            action: 'created',
            metadata: { title: body.title },
        });

        return NextResponse.json({ task }, { status: 201 });
    } catch (error) {
        console.error('Tasks POST error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
