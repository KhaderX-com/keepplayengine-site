import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { archiveNotification, deleteNotification } from '@/lib/notifications';
import { supabaseAdmin } from '@/lib/supabase';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// DELETE /api/notifications/[id] - Delete or archive a notification
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const searchParams = request.nextUrl.searchParams;
        const archive = searchParams.get('archive') === 'true';

        // Get admin user ID
        const { data: adminUser } = await supabaseAdmin
            .from('admin_users')
            .select('id')
            .eq('email', session.user.email)
            .single();

        if (!adminUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        let success: boolean;
        if (archive) {
            success = await archiveNotification(adminUser.id, id);
        } else {
            success = await deleteNotification(adminUser.id, id);
        }

        if (!success) {
            return NextResponse.json(
                { error: 'Failed to delete notification' },
                { status: 500 }
            );
        }

        return NextResponse.json({ 
            success: true,
            message: archive ? 'Notification archived' : 'Notification deleted'
        });
    } catch (error) {
        console.error('Error in DELETE /api/notifications/[id]:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
