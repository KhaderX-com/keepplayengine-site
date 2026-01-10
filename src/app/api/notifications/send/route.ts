import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
    createNotification,
    getAdminByEmail,
    getOrCreateConversation,
    sendMessage
} from '@/lib/notifications';
import { supabaseAdmin } from '@/lib/supabase';
import type { SendNotificationRequest } from '@/types/notifications';
import { logActivityWithRequest } from '@/lib/activity-logger';

// POST /api/notifications/send - Send a notification to another admin
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body: SendNotificationRequest = await request.json();
        const {
            recipient_email,
            type,
            title,
            message,
            priority = 'normal',
            action_url,
            action_label,
            related_entity_type,
            related_entity_id,
            metadata
        } = body;

        // Validate required fields
        if (!recipient_email || !type || !title || !message) {
            return NextResponse.json(
                { error: 'Missing required fields: recipient_email, type, title, message' },
                { status: 400 }
            );
        }

        // Get sender admin user
        const { data: senderAdmin } = await supabaseAdmin
            .from('admin_users')
            .select('id, email, full_name')
            .eq('email', session.user.email)
            .single();

        if (!senderAdmin) {
            return NextResponse.json({ error: 'Sender not found' }, { status: 404 });
        }

        // Get recipient admin user
        const recipientAdmin = await getAdminByEmail(recipient_email);
        if (!recipientAdmin) {
            return NextResponse.json(
                { error: 'Recipient not found or inactive' },
                { status: 404 }
            );
        }

        // Prevent sending to yourself (optional - you might want to allow this)
        if (senderAdmin.id === recipientAdmin.id) {
            return NextResponse.json(
                { error: 'Cannot send notification to yourself' },
                { status: 400 }
            );
        }

        // Create the notification
        const notification = await createNotification({
            recipientId: recipientAdmin.id,
            senderId: senderAdmin.id,
            type,
            title,
            message,
            priority,
            actionUrl: action_url,
            actionLabel: action_label,
            relatedEntityType: related_entity_type,
            relatedEntityId: related_entity_id,
            metadata: {
                ...metadata,
                sender_name: senderAdmin.full_name || senderAdmin.email
            }
        });

        if (!notification) {
            return NextResponse.json(
                { error: 'Failed to create notification' },
                { status: 500 }
            );
        }

        // If it's a direct message, also create/update the conversation
        if (type === 'direct_message') {
            const conversation = await getOrCreateConversation(senderAdmin.id, recipientAdmin.id);
            if (conversation) {
                await sendMessage(conversation.id, senderAdmin.id, message);
            }
        }

        // Log to admin activity log (excludes admin@keepplayengine.com)
        await logActivityWithRequest(request, {
            action: 'SEND_NOTIFICATION',
            resourceType: 'notification',
            resourceId: notification.id,
            description: `Sent notification: "${title}" to ${recipientAdmin.full_name || recipientAdmin.email} (${type})`,
            changes: {
                recipient: recipientAdmin.email,
                type,
                priority,
                title,
            },
        });

        return NextResponse.json({
            success: true,
            notification_id: notification.id,
            message: `Notification sent to ${recipientAdmin.full_name || recipientAdmin.email}`
        });
    } catch (error) {
        console.error('Error in POST /api/notifications/send:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
