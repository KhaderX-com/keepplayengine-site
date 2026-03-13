import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

interface RouteParams {
    params: Promise<{ taskId: string }>;
}

// =====================================================
// GET - Fetch milestone by task ID
// =====================================================
export async function GET(request: Request, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { taskId } = await params;

        // Fetch milestone for this task
        const { data: milestone, error } = await supabaseAdmin
            .from('milestones')
            .select(`
                *,
                sub_milestones(
                    *,
                    assignee:team_members(*)
                )
            `)
            .eq('task_id', taskId)
            .single();

        if (error || !milestone) {
            return NextResponse.json({ error: 'Milestone not found for this task' }, { status: 404 });
        }

        // Fetch associated task
        const { data: task } = await supabaseAdmin
            .from('tasks')
            .select(`
                *,
                assignee:team_members!tasks_assignee_id_fkey(*),
                creator:team_members!tasks_created_by_fkey(*)
            `)
            .eq('id', taskId)
            .single();

        // Sort sub-milestones by major_number and minor_number
        const sortedSubMilestones = milestone.sub_milestones?.sort((a: { major_number: number; minor_number: number }, b: { major_number: number; minor_number: number }) => {
            if (a.major_number !== b.major_number) {
                return a.major_number - b.major_number;
            }
            return a.minor_number - b.minor_number;
        }) || [];

        return NextResponse.json({
            milestone: {
                ...milestone,
                task,
                sub_milestones: sortedSubMilestones,
            },
        });
    } catch (error) {
        console.error('Milestone by task GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
