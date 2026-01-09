import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

// =====================================================
// PATCH - Update a label (SUPER_ADMIN only)
// =====================================================
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is SUPER_ADMIN
        if (session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Only Super Admins can update labels' }, { status: 403 });
        }

        const body = await request.json();
        const updates: {
            name?: string;
            color?: string;
            description?: string | null;
        } = {};

        if (body.name !== undefined) {
            if (!body.name?.trim()) {
                return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 });
            }
            updates.name = body.name.trim();
        }

        if (body.color !== undefined) {
            if (!/^#[0-9A-Fa-f]{6}$/.test(body.color)) {
                return NextResponse.json({ error: 'Invalid color format. Use hex format like #FF5733' }, { status: 400 });
            }
            updates.color = body.color;
        }

        if (body.description !== undefined) {
            updates.description = body.description?.trim() || null;
        }

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
        }

        const { data: label, error } = await supabaseAdmin
            .from('task_labels')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating label:', error);
            if (error.code === '23505') {
                return NextResponse.json({ error: 'A label with this name already exists' }, { status: 409 });
            }
            return NextResponse.json({ error: 'Failed to update label' }, { status: 500 });
        }

        if (!label) {
            return NextResponse.json({ error: 'Label not found' }, { status: 404 });
        }

        return NextResponse.json({ label });
    } catch (error) {
        console.error('Label PATCH error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// =====================================================
// DELETE - Delete a label (SUPER_ADMIN only)
// =====================================================
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is SUPER_ADMIN
        if (session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Only Super Admins can delete labels' }, { status: 403 });
        }

        // Check if label is in use
        const { count: assignmentCount } = await supabaseAdmin
            .from('task_label_assignments')
            .select('*', { count: 'exact', head: true })
            .eq('label_id', id);

        if (assignmentCount && assignmentCount > 0) {
            return NextResponse.json(
                { error: `Cannot delete label. It is currently used by ${assignmentCount} task(s)` },
                { status: 409 }
            );
        }

        const { error } = await supabaseAdmin
            .from('task_labels')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting label:', error);
            return NextResponse.json({ error: 'Failed to delete label' }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Label deleted successfully' });
    } catch (error) {
        console.error('Label DELETE error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
