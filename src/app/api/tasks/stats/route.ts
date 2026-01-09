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

        // Get task assignees from junction table
        const { data: taskAssignees } = await supabaseAdmin
            .from('task_assignees')
            .select('task_id, team_member_id');

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
            by_assignee: members?.map(member => {
                // Get task IDs assigned to this member from task_assignees table
                const memberTaskIds = taskAssignees
                    ?.filter(ta => ta.team_member_id === member.id)
                    .map(ta => ta.task_id) || [];

                // Also include tasks with old assignee_id field for backwards compatibility
                const legacyTasks = tasks?.filter(t => t.assignee_id === member.id) || [];
                const legacyTaskIds = legacyTasks.map(t => t.id);

                // Combine both (remove duplicates)
                const allTaskIds = [...new Set([...memberTaskIds, ...legacyTaskIds])];

                // Filter tasks that belong to this member
                const memberTasks = tasks?.filter(t => allTaskIds.includes(t.id)) || [];

                return {
                    member,
                    total: memberTasks.length,
                    completed: memberTasks.filter(t => t.status === 'done').length,
                };
            }) || [],
        };

        return NextResponse.json({ stats });
    } catch (error) {
        console.error('Stats GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
