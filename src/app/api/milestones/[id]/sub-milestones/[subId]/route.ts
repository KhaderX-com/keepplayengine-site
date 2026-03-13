import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import type { UpdateSubMilestoneRequest } from '@/types/tasks';
import { logActivityWithRequest } from '@/lib/activity-logger';

interface RouteParams {
    params: Promise<{ id: string; subId: string }>;
}

// =====================================================
// GET - Fetch single sub-milestone
// =====================================================
export async function GET(request: Request, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { subId } = await params;

        const { data: subMilestone, error } = await supabaseAdmin
            .from('sub_milestones')
            .select(`
                *,
                assignee:team_members(*)
            `)
            .eq('id', subId)
            .single();

        if (error || !subMilestone) {
            return NextResponse.json({ error: 'Sub-milestone not found' }, { status: 404 });
        }

        return NextResponse.json({ subMilestone });
    } catch (error) {
        console.error('Sub-milestone GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// =====================================================
// PATCH - Update a sub-milestone
// =====================================================
export async function PATCH(request: Request, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { subId } = await params;
        const body: UpdateSubMilestoneRequest = await request.json();

        // Get current sub-milestone
        const { data: existing, error: fetchError } = await supabaseAdmin
            .from('sub_milestones')
            .select('*')
            .eq('id', subId)
            .single();

        if (fetchError || !existing) {
            return NextResponse.json({ error: 'Sub-milestone not found' }, { status: 404 });
        }

        // Prepare update data
        const updateData: Record<string, unknown> = {
            ...body,
            updated_at: new Date().toISOString(),
        };

        // Set completed_at when status changes to completed
        if (body.status === 'completed' && existing.status !== 'completed') {
            updateData.completed_at = new Date().toISOString();
            updateData.progress_percentage = 100;
        } else if (body.status && body.status !== 'completed') {
            updateData.completed_at = null;
        }

        // Update sub-milestone
        const { data: subMilestone, error } = await supabaseAdmin
            .from('sub_milestones')
            .update(updateData)
            .eq('id', subId)
            .select(`
                *,
                assignee:team_members(*)
            `)
            .single();

        if (error) {
            console.error('Error updating sub-milestone:', error);
            return NextResponse.json({ error: 'Failed to update sub-milestone' }, { status: 500 });
        }

        // Log activity
        await logActivityWithRequest(request, {
            action: 'update_sub_milestone',
            resourceType: 'sub_milestone',
            resourceId: subId,
            description: `Updated sub-milestone M${subMilestone.major_number}.${subMilestone.minor_number}`,
            changes: body as Record<string, unknown>,
        });

        return NextResponse.json({ subMilestone });
    } catch (error) {
        console.error('Sub-milestone PATCH error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// =====================================================
// DELETE - Remove a sub-milestone
// =====================================================
export async function DELETE(request: Request, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { subId } = await params;

        // Get sub-milestone info for logging
        const { data: existing, error: fetchError } = await supabaseAdmin
            .from('sub_milestones')
            .select('major_number, minor_number, title')
            .eq('id', subId)
            .single();

        if (fetchError || !existing) {
            return NextResponse.json({ error: 'Sub-milestone not found' }, { status: 404 });
        }

        // Delete sub-milestone
        const { error } = await supabaseAdmin
            .from('sub_milestones')
            .delete()
            .eq('id', subId);

        if (error) {
            console.error('Error deleting sub-milestone:', error);
            return NextResponse.json({ error: 'Failed to delete sub-milestone' }, { status: 500 });
        }

        // Log activity
        await logActivityWithRequest(request, {
            action: 'delete_sub_milestone',
            resourceType: 'sub_milestone',
            resourceId: subId,
            description: `Deleted sub-milestone M${existing.major_number}.${existing.minor_number}: ${existing.title}`,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Sub-milestone DELETE error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
