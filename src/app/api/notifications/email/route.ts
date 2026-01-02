import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendEmailNotification, sendTestEmail } from '@/lib/email-notifications';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * POST /api/notifications/email
 * Send email notification for a notification record
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { notificationId, testEmail } = body;

        // Handle test email
        if (testEmail) {
            const result = await sendTestEmail(testEmail);
            return NextResponse.json(result);
        }

        // Send email for existing notification
        if (!notificationId) {
            return NextResponse.json(
                { error: 'Notification ID required' },
                { status: 400 }
            );
        }

        // Fetch notification details
        const { data: notification, error: notifError } = await supabaseAdmin
            .from('notifications')
            .select(`
                *,
                recipient:recipient_id(email, full_name),
                sender:sender_id(full_name)
            `)
            .eq('id', notificationId)
            .single();

        if (notifError || !notification) {
            return NextResponse.json(
                { error: 'Notification not found' },
                { status: 404 }
            );
        }

        // Check if recipient has email notifications enabled
        const { data: preferences } = await supabaseAdmin
            .from('notification_preferences')
            .select('email_enabled')
            .eq('admin_user_id', notification.recipient_id)
            .single();

        if (preferences && !preferences.email_enabled) {
            return NextResponse.json({
                success: false,
                error: 'Email notifications disabled for this user'
            });
        }

        // Send email
        const result = await sendEmailNotification({
            recipientEmail: notification.recipient.email,
            recipientName: notification.recipient.full_name || 'Admin',
            notification: notification,
            senderName: notification.sender?.full_name
        });

        // Log delivery attempt
        if (result.success) {
            await supabaseAdmin.from('notification_delivery_log').insert({
                notification_id: notificationId,
                channel: 'email',
                status: 'delivered',
                email_message_id: result.messageId,
                delivered_at: new Date().toISOString()
            });
        } else {
            await supabaseAdmin.from('notification_delivery_log').insert({
                notification_id: notificationId,
                channel: 'email',
                status: 'failed',
                error_message: result.error
            });
        }

        return NextResponse.json(result);

    } catch (error) {
        console.error('Error in email notification API:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
