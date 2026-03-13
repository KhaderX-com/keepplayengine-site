import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import type { CreateMilestoneRequest } from '@/types/tasks';
import { logActivityWithRequest } from '@/lib/activity-logger';

// =====================================================
// GET - Fetch all milestones with their tasks
// =====================================================
export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        // Fetch all tasks marked as milestones
        let query = supabaseAdmin
            .from('tasks')
            .select(`
                *,
                assignee:team_members!tasks_assignee_id_fkey(*),
                creator:team_members!tasks_created_by_fkey(*)
            `)
            .eq('is_milestone', true)
            .order('created_at', { ascending: false });

        if (status) {
            query = query.eq('status', status);
        }

        const { data: milestoneTasks, error: tasksError } = await query;

        if (tasksError) {
            console.error('Error fetching milestone tasks:', tasksError);
            return NextResponse.json({ error: 'Failed to fetch milestones' }, { status: 500 });
        }

        // Fetch milestone data for each task
        const taskIds = milestoneTasks?.map(t => t.id) || [];

        if (taskIds.length === 0) {
            return NextResponse.json({ milestones: [] });
        }

        const { data: milestoneData, error: milestoneError } = await supabaseAdmin
            .from('milestones')
            .select(`
                *,
                sub_milestones(*)
            `)
            .in('task_id', taskIds);

        if (milestoneError) {
            console.error('Error fetching milestone data:', milestoneError);
        }

        // Combine task and milestone data
        const milestones = milestoneTasks?.map(task => {
            const milestone = milestoneData?.find(m => m.task_id === task.id);
            return {
                ...task,
                milestone: milestone || null,
                sub_milestone_count: milestone?.sub_milestones?.length || 0,
                completed_sub_milestones: milestone?.sub_milestones?.filter(
                    (sm: { status: string }) => sm.status === 'completed'
                ).length || 0,
            };
        }) || [];

        return NextResponse.json({ milestones });
    } catch (error) {
        console.error('Milestones GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// =====================================================
// POST - Create a new milestone for a task
// =====================================================
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body: CreateMilestoneRequest = await request.json();

        if (!body.task_id) {
            return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
        }

        // Check if task exists
        const { data: task, error: taskError } = await supabaseAdmin
            .from('tasks')
            .select('id, title')
            .eq('id', body.task_id)
            .single();

        if (taskError || !task) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        // Mark task as milestone
        const { error: updateError } = await supabaseAdmin
            .from('tasks')
            .update({ is_milestone: true })
            .eq('id', body.task_id);

        if (updateError) {
            console.error('Error marking task as milestone:', updateError);
            return NextResponse.json({ error: 'Failed to mark task as milestone' }, { status: 500 });
        }

        // Create milestone record
        const { data: milestone, error: milestoneError } = await supabaseAdmin
            .from('milestones')
            .insert({
                task_id: body.task_id,
                description: body.description || null,
                target_date: body.target_date || null,
                status: 'not_started',
                progress_percentage: 0,
            })
            .select()
            .single();

        if (milestoneError) {
            console.error('Error creating milestone:', milestoneError);
            // Revert task milestone status
            await supabaseAdmin
                .from('tasks')
                .update({ is_milestone: false })
                .eq('id', body.task_id);
            return NextResponse.json({ error: 'Failed to create milestone' }, { status: 500 });
        }

        // Log activity
        await logActivityWithRequest(request, {
            action: 'create_milestone',
            resourceType: 'milestone',
            resourceId: milestone.id,
            description: `Created milestone for task: ${task.title}`,
        });

        return NextResponse.json({ milestone }, { status: 201 });
    } catch (error) {
        console.error('Milestone POST error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
