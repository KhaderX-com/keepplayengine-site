import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

// =====================================================
// GET - Fetch all team members
// =====================================================
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: members, error } = await supabaseAdmin
            .from('team_members')
            .select('*')
            .eq('is_active', true)
            .order('name', { ascending: true });

        if (error) {
            console.error('Error fetching team members:', error);
            return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 });
        }

        return NextResponse.json({ members: members || [] });
    } catch (error) {
        console.error('Team members GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// =====================================================
// POST - Create a new team member
// =====================================================
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();

        if (!body.name?.trim()) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        const { data: member, error } = await supabaseAdmin
            .from('team_members')
            .insert({
                name: body.name.trim(),
                email: body.email?.trim() || null,
                avatar_url: body.avatar_url || null,
                color: body.color || '#3B82F6',
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating team member:', error);
            return NextResponse.json({ error: 'Failed to create team member' }, { status: 500 });
        }

        return NextResponse.json({ member }, { status: 201 });
    } catch (error) {
        console.error('Team members POST error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
