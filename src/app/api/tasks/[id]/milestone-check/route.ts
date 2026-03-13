import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * GET - Check if a task has associated milestones and sub-milestones
 * Returns the count of milestones and sub-milestones that will be deleted
 */
export async function GET(request: Request, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // Check if the task is marked as a milestone
        const { data: task, error: taskError } = await supabaseAdmin
            .from('tasks')
            .select('is_milestone, title')
            .eq('id', id)
            .single();

        if (taskError || !task) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        // If not a milestone, no dependencies
        if (!task.is_milestone) {
            return NextResponse.json({
                hasMilestones: false,
                milestoneCount: 0,
                subMilestoneCount: 0,
                taskTitle: task.title,
            });
        }

        // Get the milestone record for this task
        const { data: milestone, error: milestoneError } = await supabaseAdmin
            .from('milestones')
            .select('id')
            .eq('task_id', id)
            .single();

        if (milestoneError || !milestone) {
            return NextResponse.json({
                hasMilestones: false,
                milestoneCount: 0,
                subMilestoneCount: 0,
                taskTitle: task.title,
            });
        }

        // Count sub-milestones
        const { count: subMilestoneCount, error: subMilestoneError } = await supabaseAdmin
            .from('sub_milestones')
            .select('*', { count: 'exact', head: true })
            .eq('milestone_id', milestone.id);

        if (subMilestoneError) {
            console.error('Error counting sub-milestones:', subMilestoneError);
            return NextResponse.json({ error: 'Failed to check sub-milestones' }, { status: 500 });
        }

        return NextResponse.json({
            hasMilestones: true,
            milestoneCount: 1,
            subMilestoneCount: subMilestoneCount || 0,
            taskTitle: task.title,
        });
    } catch (error) {
        console.error('Milestone check error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
