import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAllAdminUsers } from '@/lib/notifications';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/notifications/recipients - Get all admin users for recipient selection
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get current admin user to exclude from list
        const { data: currentAdmin } = await supabaseAdmin
            .from('admin_users')
            .select('id')
            .eq('email', session.user.email)
            .single();

        const allAdmins = await getAllAdminUsers();

        // Filter out current user
        const recipients = allAdmins.filter(admin => admin.id !== currentAdmin?.id);

        return NextResponse.json({ recipients });
    } catch (error) {
        console.error('Error in GET /api/notifications/recipients:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
