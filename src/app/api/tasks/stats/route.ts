import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

// =====================================================
// GET - Fetch task statistics
// =====================================================
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get all top-level tasks (not subtasks)
        const { data: tasks, error: tasksError } = await supabaseAdmin
            .from('tasks')
            .select('id, status, assignee_id, due_date')
            .is('parent_task_id', null);

        if (tasksError) {
            console.error('Error fetching task stats:', tasksError);
            return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
        }

        // Get team members
        const { data: members } = await supabaseAdmin
            .from('team_members')
            .select('*')
            .eq('is_active', true);

        const now = new Date();

        // Calculate stats
        const stats = {
            total: tasks?.length || 0,
            todo: tasks?.filter(t => t.status === 'todo').length || 0,
            in_progress: tasks?.filter(t => t.status === 'in_progress').length || 0,
            done: tasks?.filter(t => t.status === 'done').length || 0,
            overdue: tasks?.filter(t =>
                t.due_date &&
                new Date(t.due_date) < now &&
                t.status !== 'done'
            ).length || 0,
            by_assignee: members?.map(member => ({
                member,
                total: tasks?.filter(t => t.assignee_id === member.id).length || 0,
                completed: tasks?.filter(t =>
                    t.assignee_id === member.id &&
                    t.status === 'done'
                ).length || 0,
            })) || [],
        };

        return NextResponse.json({ stats });
    } catch (error) {
        console.error('Stats GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
