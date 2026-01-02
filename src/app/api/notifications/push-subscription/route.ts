import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { savePushSubscription, getUserPushSubscriptions, removePushSubscription } from '@/lib/notifications';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/notifications/push-subscription - Get user's push subscriptions
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: adminUser } = await supabaseAdmin
            .from('admin_users')
            .select('id')
            .eq('email', session.user.email)
            .single();

        if (!adminUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const subscriptions = await getUserPushSubscriptions(adminUser.id);

        return NextResponse.json({ subscriptions });
    } catch (error) {
        console.error('Error in GET /api/notifications/push-subscription:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST /api/notifications/push-subscription - Save a push subscription
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { subscription, deviceInfo } = body;

        if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
            return NextResponse.json(
                { error: 'Invalid subscription data' },
                { status: 400 }
            );
        }

        const { data: adminUser } = await supabaseAdmin
            .from('admin_users')
            .select('id')
            .eq('email', session.user.email)
            .single();

        if (!adminUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const success = await savePushSubscription(adminUser.id, subscription, deviceInfo);

        if (!success) {
            return NextResponse.json(
                { error: 'Failed to save subscription' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Push subscription saved successfully'
        });
    } catch (error) {
        console.error('Error in POST /api/notifications/push-subscription:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE /api/notifications/push-subscription - Remove a push subscription
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { subscriptionId } = body;

        if (!subscriptionId) {
            return NextResponse.json(
                { error: 'Subscription ID required' },
                { status: 400 }
            );
        }

        const { data: adminUser } = await supabaseAdmin
            .from('admin_users')
            .select('id')
            .eq('email', session.user.email)
            .single();

        if (!adminUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const success = await removePushSubscription(adminUser.id, subscriptionId);

        if (!success) {
            return NextResponse.json(
                { error: 'Failed to remove subscription' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Push subscription removed'
        });
    } catch (error) {
        console.error('Error in DELETE /api/notifications/push-subscription:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
