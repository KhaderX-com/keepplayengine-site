import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// =====================================================
// GET - Fetch comments for a task
// =====================================================
export async function GET(request: Request, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const { data: comments, error } = await supabaseAdmin
            .from('task_comments')
            .select(`
                *,
                author:team_members(*)
            `)
            .eq('task_id', id)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching comments:', error);
            return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
        }

        return NextResponse.json({ comments: comments || [] });
    } catch (error) {
        console.error('Comments GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// =====================================================
// POST - Add a comment to a task
// =====================================================
export async function POST(request: Request, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const { content } = await request.json();

        if (!content?.trim()) {
            return NextResponse.json({ error: 'Content is required' }, { status: 400 });
        }

        // Get current user
        const { data: currentMember } = await supabaseAdmin
            .from('team_members')
            .select('id')
            .eq('email', session.user?.email)
            .single();

        // Create comment
        const { data: comment, error } = await supabaseAdmin
            .from('task_comments')
            .insert({
                task_id: id,
                author_id: currentMember?.id || null,
                content: content.trim(),
            })
            .select(`
                *,
                author:team_members(*)
            `)
            .single();

        if (error) {
            console.error('Error creating comment:', error);
            return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
        }

        // Log activity
        await supabaseAdmin.from('task_activity_log').insert({
            task_id: id,
            actor_id: currentMember?.id || null,
            action: 'commented',
            metadata: { comment_id: comment.id },
        });

        return NextResponse.json({ comment }, { status: 201 });
    } catch (error) {
        console.error('Comments POST error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
