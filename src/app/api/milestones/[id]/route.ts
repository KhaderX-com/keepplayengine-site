import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import type { UpdateMilestoneRequest, CreateSubMilestoneRequest } from '@/types/tasks';
import { logActivityWithRequest } from '@/lib/activity-logger';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// =====================================================
// GET - Fetch single milestone with sub-milestones
// =====================================================
export async function GET(request: Request, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // Fetch milestone with sub-milestones
        const { data: milestone, error } = await supabaseAdmin
            .from('milestones')
            .select(`
                *,
                sub_milestones(
                    *,
                    assignee:team_members(*)
                )
            `)
            .eq('id', id)
            .single();

        if (error || !milestone) {
            return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
        }

        // Fetch associated task
        const { data: task } = await supabaseAdmin
            .from('tasks')
            .select(`
                *,
                assignee:team_members!tasks_assignee_id_fkey(*),
                creator:team_members!tasks_created_by_fkey(*)
            `)
            .eq('id', milestone.task_id)
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
        console.error('Milestone GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// =====================================================
// PATCH - Update a milestone
// =====================================================
export async function PATCH(request: Request, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body: UpdateMilestoneRequest = await request.json();

        // Update milestone
        const { data: milestone, error } = await supabaseAdmin
            .from('milestones')
            .update({
                ...body,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating milestone:', error);
            return NextResponse.json({ error: 'Failed to update milestone' }, { status: 500 });
        }

        // Log activity
        await logActivityWithRequest(request, {
            action: 'update_milestone',
            resourceType: 'milestone',
            resourceId: id,
            description: 'Updated milestone',
            changes: body as Record<string, unknown>,
        });

        return NextResponse.json({ milestone });
    } catch (error) {
        console.error('Milestone PATCH error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// =====================================================
// DELETE - Remove milestone (unmark task as milestone)
// =====================================================
export async function DELETE(request: Request, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // Get milestone to find task_id
        const { data: milestone, error: fetchError } = await supabaseAdmin
            .from('milestones')
            .select('task_id')
            .eq('id', id)
            .single();

        if (fetchError || !milestone) {
            return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
        }

        // Delete milestone (cascade will delete sub_milestones)
        const { error: deleteError } = await supabaseAdmin
            .from('milestones')
            .delete()
            .eq('id', id);

        if (deleteError) {
            console.error('Error deleting milestone:', deleteError);
            return NextResponse.json({ error: 'Failed to delete milestone' }, { status: 500 });
        }

        // Unmark task as milestone
        await supabaseAdmin
            .from('tasks')
            .update({ is_milestone: false })
            .eq('id', milestone.task_id);

        // Log activity
        await logActivityWithRequest(request, {
            action: 'delete_milestone',
            resourceType: 'milestone',
            resourceId: id,
            description: 'Removed milestone from task',
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Milestone DELETE error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
