import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
    getUserNotifications,
    markNotificationsAsRead,
    getUnreadCount
} from '@/lib/notifications';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/notifications - Get user's notifications
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = parseInt(searchParams.get('offset') || '0');
        const unreadOnly = searchParams.get('unreadOnly') === 'true';

        // Get admin user ID from session email
        const { data: adminUser } = await supabaseAdmin
            .from('admin_users')
            .select('id')
            .eq('email', session.user.email)
            .single();

        if (!adminUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const result = await getUserNotifications(adminUser.id, {
            limit,
            offset,
            unreadOnly
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error in GET /api/notifications:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST /api/notifications - Mark notifications as read
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { action, notificationIds } = body;

        // Get admin user ID
        const { data: adminUser } = await supabaseAdmin
            .from('admin_users')
            .select('id')
            .eq('email', session.user.email)
            .single();

        if (!adminUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (action === 'mark_read') {
            const count = await markNotificationsAsRead(adminUser.id, notificationIds);
            const newUnreadCount = await getUnreadCount(adminUser.id);
            return NextResponse.json({
                success: true,
                marked_count: count,
                unread_count: newUnreadCount
            });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Error in POST /api/notifications:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
