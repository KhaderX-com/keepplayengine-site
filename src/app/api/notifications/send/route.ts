import { NextResponse } from "next/server";
import { sendNotificationSchema } from "@/lib/schemas";
import { createApiHandler } from "@/lib/api-gateway";
import { getUserClient, AdminDAL } from "@/lib/dal";
import {
    createNotification,
    getAdminByEmail,
    getOrCreateConversation,
    sendMessage,
} from "@/lib/notifications";

// POST /api/notifications/send - Send a notification to another admin
export const POST = createApiHandler(
    { bodySchema: sendNotificationSchema, rateLimit: { limit: 30, windowMs: 60_000 } },
    async (_req, ctx) => {
        const body = ctx.body!;
        const client = await getUserClient(ctx.session.user.id, ctx.session.user.role);

        const senderId = ctx.session.user.id;
        const senderEmail = ctx.session.user.email;
        const senderName = ctx.session.user.name || senderEmail;

        // Get recipient admin user
        const recipientAdmin = await getAdminByEmail(body.recipient_email);
        if (!recipientAdmin) {
            return NextResponse.json({ error: "Recipient not found or inactive" }, { status: 404 });
        }

        if (senderId === recipientAdmin.id) {
            return NextResponse.json({ error: "Cannot send notification to yourself" }, { status: 400 });
        }

        const notification = await createNotification({
            recipientId: recipientAdmin.id,
            senderId,
            type: body.type,
            title: body.title,
            message: body.message,
            priority: body.priority,
            actionUrl: body.action_url,
            actionLabel: body.action_label,
            relatedEntityType: body.related_entity_type,
            relatedEntityId: body.related_entity_id,
            metadata: { ...body.metadata, sender_name: senderName },
        });

        if (!notification) {
            return NextResponse.json({ error: "Failed to create notification" }, { status: 500 });
        }

        // If it's a direct message, also create/update the conversation
        if (body.type === "direct_message") {
            const conversation = await getOrCreateConversation(senderId, recipientAdmin.id);
            if (conversation) {
                await sendMessage(conversation.id, senderId, body.message);
            }
        }

        await AdminDAL.logActivity(client, {
            admin_user_id: senderId,
            action: "SEND_NOTIFICATION",
            resource_type: "notification",
            resource_id: notification.id,
            description: `Sent notification: "${body.title}" to ${recipientAdmin.full_name || recipientAdmin.email} (${body.type})`,
            changes: {
                recipient: body.recipient_email,
                type: body.type,
                priority: body.priority,
                title: body.title,
            },
            ip_address: ctx.ip,
            user_agent: ctx.userAgent,
        });

        return NextResponse.json({
            success: true,
            notification_id: notification.id,
            message: `Notification sent to ${recipientAdmin.full_name || recipientAdmin.email}`,
        });
    }
);
