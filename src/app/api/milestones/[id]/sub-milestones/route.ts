import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import type { CreateSubMilestoneRequest, UpdateSubMilestoneRequest } from '@/types/tasks';
import { logActivityWithRequest } from '@/lib/activity-logger';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// =====================================================
// GET - Fetch all sub-milestones for a milestone
// =====================================================
export async function GET(request: Request, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const { data: subMilestones, error } = await supabaseAdmin
            .from('sub_milestones')
            .select(`
                *,
                assignee:team_members(*)
            `)
            .eq('milestone_id', id)
            .order('major_number', { ascending: true })
            .order('minor_number', { ascending: true });

        if (error) {
            console.error('Error fetching sub-milestones:', error);
            return NextResponse.json({ error: 'Failed to fetch sub-milestones' }, { status: 500 });
        }

        return NextResponse.json({ subMilestones: subMilestones || [] });
    } catch (error) {
        console.error('Sub-milestones GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// =====================================================
// POST - Create a new sub-milestone
// =====================================================
export async function POST(request: Request, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body: Omit<CreateSubMilestoneRequest, 'milestone_id'> = await request.json();

        if (!body.title) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 });
        }

        // Verify milestone exists
        const { data: milestone, error: milestoneError } = await supabaseAdmin
            .from('milestones')
            .select('id, task_id')
            .eq('id', id)
            .single();

        if (milestoneError || !milestone) {
            return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
        }

        // Auto-calculate major/minor numbers if not provided
        let majorNumber = body.major_number;
        let minorNumber = body.minor_number;

        if (!majorNumber || !minorNumber) {
            // Get existing sub-milestones to determine next number
            const { data: existing } = await supabaseAdmin
                .from('sub_milestones')
                .select('major_number, minor_number')
                .eq('milestone_id', id)
                .order('major_number', { ascending: false })
                .order('minor_number', { ascending: false })
                .limit(1);

            if (existing && existing.length > 0) {
                majorNumber = majorNumber || existing[0].major_number;
                minorNumber = (existing[0].minor_number || 0) + 1;
            } else {
                majorNumber = 1;
                minorNumber = 1;
            }
        }

        // Get position for new sub-milestone
        const { data: positionData } = await supabaseAdmin
            .from('sub_milestones')
            .select('position')
            .eq('milestone_id', id)
            .order('position', { ascending: false })
            .limit(1);

        const position = positionData && positionData.length > 0 ? positionData[0].position + 1 : 0;

        // Create sub-milestone
        const { data: subMilestone, error } = await supabaseAdmin
            .from('sub_milestones')
            .insert({
                milestone_id: id,
                major_number: majorNumber,
                minor_number: minorNumber,
                title: body.title,
                description: body.description || null,
                status: 'not_started',
                target_date: body.target_date || null,
                assignee_id: body.assignee_id || null,
                priority: body.priority || 'medium',
                notes: body.notes || null,
                position,
            })
            .select(`
                *,
                assignee:team_members(*)
            `)
            .single();

        if (error) {
            console.error('Error creating sub-milestone:', error);
            if (error.code === '23505') {
                return NextResponse.json({
                    error: `Sub-milestone M${majorNumber}.${minorNumber} already exists`
                }, { status: 400 });
            }
            return NextResponse.json({ error: 'Failed to create sub-milestone' }, { status: 500 });
        }

        // Log activity
        await logActivityWithRequest(request, {
            action: 'create_sub_milestone',
            resourceType: 'sub_milestone',
            resourceId: subMilestone.id,
            description: `Created sub-milestone M${majorNumber}.${minorNumber}: ${body.title}`,
        });

        return NextResponse.json({ subMilestone }, { status: 201 });
    } catch (error) {
        console.error('Sub-milestone POST error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
