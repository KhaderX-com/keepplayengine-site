import { NextResponse } from "next/server";
import { emailNotificationSchema } from "@/lib/schemas";
import { createApiHandler } from "@/lib/api-gateway";
import { sendEmailNotification, sendTestEmail } from "@/lib/email-notifications";
import { getUserClient } from "@/lib/dal";

// POST /api/notifications/email - Send email notification
export const POST = createApiHandler(
    { bodySchema: emailNotificationSchema, rateLimit: { limit: 10, windowMs: 60_000 } },
    async (_req, ctx) => {
        const { notificationId, testEmail } = ctx.body!;

        if (testEmail) {
            // Only SUPER_ADMIN can send test emails
            if (ctx.session.user.role !== "SUPER_ADMIN") {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
            const result = await sendTestEmail(testEmail);
            return NextResponse.json(result);
        }

        const client = await getUserClient(ctx.session.user.id, ctx.session.user.role);

        // Fetch notification details
        const { data: notification, error: notifError } = await client
            .from("notifications")
            .select("*, recipient:recipient_id(email, full_name), sender:sender_id(full_name)")
            .eq("id", notificationId!)
            .single();

        if (notifError || !notification) {
            return NextResponse.json({ error: "Notification not found" }, { status: 404 });
        }

        // Check if recipient has email notifications enabled
        const { data: preferences } = await client
            .from("notification_preferences")
            .select("email_enabled")
            .eq("admin_user_id", notification.recipient_id)
            .single();

        if (preferences && !preferences.email_enabled) {
            return NextResponse.json({ success: false, error: "Email notifications disabled for this user" });
        }

        const result = await sendEmailNotification({
            recipientEmail: notification.recipient.email,
            recipientName: notification.recipient.full_name || "Admin",
            notification,
            senderName: notification.sender?.full_name,
        });

        // Log delivery attempt
        await client.from("notification_delivery_log").insert({
            notification_id: notificationId,
            channel: "email",
            status: result.success ? "delivered" : "failed",
            ...(result.success
                ? { email_message_id: result.messageId, delivered_at: new Date().toISOString() }
                : { error_message: result.error }),
        });

        return NextResponse.json(result);
    }
);
