import { Resend } from 'resend';
import type { Notification } from '@/types/notifications';

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailNotificationOptions {
    recipientEmail: string;
    recipientName: string;
    notification: Notification;
    senderName?: string;
}

/**
 * Send email notification using Resend
 */
export async function sendEmailNotification({
    recipientEmail,
    recipientName,
    notification,
    senderName = 'KeepPlay Engine Team'
}: EmailNotificationOptions) {
    try {
        // Get priority styling
        const priorityStyles = {
            urgent: {
                color: '#DC2626',
                badge: '🚨 URGENT',
                borderColor: '#DC2626'
            },
            high: {
                color: '#EA580C',
                badge: '⚠️ HIGH PRIORITY',
                borderColor: '#EA580C'
            },
            normal: {
                color: '#2563EB',
                badge: '',
                borderColor: '#2563EB'
            },
            low: {
                color: '#6B7280',
                badge: '',
                borderColor: '#6B7280'
            }
        };

        const style = priorityStyles[notification.priority];
        const actionUrl = notification.action_url || 'https://keepplayengine.com/admin/notifications';

        const { data, error } = await resend.emails.send({
            from: 'KeepPlay Engine <notifications@keepplayengine.com>',
            to: [recipientEmail],
            subject: `${style.badge ? style.badge + ' ' : ''}${notification.title}`,
            html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">KeepPlay Engine</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">Admin Notification</p>
        </div>

        <!-- Content -->
        <div style="background: white; padding: 32px; border-left: 4px solid ${style.borderColor}; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <!-- Priority Badge -->
            ${style.badge ? `
            <div style="display: inline-block; padding: 6px 12px; background-color: ${style.color}15; color: ${style.color}; border-radius: 6px; font-size: 12px; font-weight: 600; margin-bottom: 16px;">
                ${style.badge}
            </div>
            ` : ''}

            <!-- Greeting -->
            <p style="margin: 0 0 16px 0; color: #374151; font-size: 15px;">
                Hi ${recipientName},
            </p>

            <!-- Title -->
            <h2 style="margin: 0 0 12px 0; color: #111827; font-size: 20px; font-weight: 600; line-height: 1.4;">
                ${notification.title}
            </h2>

            <!-- Message -->
            <div style="margin: 0 0 24px 0; color: #4b5563; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">
                ${notification.message}
            </div>

            <!-- Sender Info -->
            ${senderName && notification.sender_id ? `
            <div style="padding: 16px; background-color: #f3f4f6; border-radius: 8px; margin-bottom: 24px;">
                <p style="margin: 0; color: #6b7280; font-size: 13px;">
                    <strong style="color: #374151;">From:</strong> ${senderName}
                </p>
            </div>
            ` : ''}

            <!-- Action Button -->
            ${notification.action_url ? `
            <div style="text-align: center; margin: 24px 0;">
                <a href="${actionUrl}" style="display: inline-block; padding: 12px 32px; background-color: ${style.color}; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; transition: opacity 0.2s;">
                    ${notification.action_label || 'View Notification'}
                </a>
            </div>
            ` : ''}
        </div>

        <!-- Footer -->
        <div style="background: #f9fafb; padding: 24px; border-radius: 0 0 12px 12px; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 13px; text-align: center;">
                You received this notification because you're an admin at KeepPlay Engine.
            </p>
            <div style="text-align: center; margin-top: 16px;">
                <a href="https://keepplayengine.com/admin/notifications" style="color: ${style.color}; text-decoration: none; font-size: 13px; font-weight: 500;">
                    View All Notifications →
                </a>
            </div>
            <p style="margin: 16px 0 0 0; color: #9ca3af; font-size: 12px; text-align: center;">
                © ${new Date().getFullYear()} KeepPlay Engine. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>
            `,
            text: `
${style.badge ? style.badge + '\n\n' : ''}${notification.title}

Hi ${recipientName},

${notification.message}

${senderName && notification.sender_id ? `From: ${senderName}\n\n` : ''}
${notification.action_url ? `${notification.action_label || 'View Notification'}: ${actionUrl}\n\n` : ''}
---
You received this notification because you're an admin at KeepPlay Engine.
View all notifications: https://keepplayengine.com/admin/notifications

© ${new Date().getFullYear()} KeepPlay Engine. All rights reserved.
            `.trim()
        });

        if (error) {
            console.error('Failed to send email notification:', error);
            throw error;
        }

        console.log('Email notification sent successfully:', data?.id);
        return { success: true, messageId: data?.id };

    } catch (error) {
        console.error('Error sending email notification:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Send test email to verify Resend setup
 */
export async function sendTestEmail(toEmail: string) {
    try {
        const { data, error } = await resend.emails.send({
            from: 'KeepPlay Engine <notifications@keepplayengine.com>',
            to: [toEmail],
            subject: '✅ Email Notifications Configured Successfully',
            html: `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
    <h1 style="color: #2563eb;">🎉 Success!</h1>
    <p>Your email notification system is now configured and working properly.</p>
    <p>You'll receive admin notifications at this email address.</p>
    <hr>
    <p style="color: #6b7280; font-size: 14px;">Sent from KeepPlay Engine Admin Panel</p>
</body>
</html>
            `
        });

        if (error) throw error;
        return { success: true, messageId: data?.id };
    } catch (error) {
        console.error('Test email failed:', error);
        return { success: false, error };
    }
}
