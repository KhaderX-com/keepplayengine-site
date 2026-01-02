import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUnreadCount } from '@/lib/notifications';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/notifications/count - Get unread notification count
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get admin user ID
        const { data: adminUser } = await supabaseAdmin
            .from('admin_users')
            .select('id')
            .eq('email', session.user.email)
            .single();

        if (!adminUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const count = await getUnreadCount(adminUser.id);

        return NextResponse.json({ unread_count: count });
    } catch (error) {
        console.error('Error in GET /api/notifications/count:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
