import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

// =====================================================
// GET - Fetch all task labels
// =====================================================
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: labels, error } = await supabaseAdmin
            .from('task_labels')
            .select('*')
            .order('name', { ascending: true });

        if (error) {
            console.error('Error fetching labels:', error);
            return NextResponse.json({ error: 'Failed to fetch labels' }, { status: 500 });
        }

        return NextResponse.json({ labels: labels || [] });
    } catch (error) {
        console.error('Labels GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// =====================================================
// POST - Create a new label
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

        const { data: label, error } = await supabaseAdmin
            .from('task_labels')
            .insert({
                name: body.name.trim(),
                color: body.color || '#6B7280',
                description: body.description?.trim() || null,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating label:', error);
            return NextResponse.json({ error: 'Failed to create label' }, { status: 500 });
        }

        return NextResponse.json({ label }, { status: 201 });
    } catch (error) {
        console.error('Labels POST error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
