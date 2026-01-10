import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * Activity Logger Utility
 * Logs admin actions to admin_activity_log table
 * Excludes admin@keepplayengine.com (dev account) from logging
 */

interface LogActivityParams {
    action: string;
    resourceType: string;
    resourceId?: string | null;
    description?: string;
    changes?: Record<string, unknown>;
    severity?: 'info' | 'warning' | 'error';
    ipAddress?: string;
    userAgent?: string | null;
}

/**
 * Extract IP address from request headers
 */
export function getClientIP(request: Request): string {
    const headers = request.headers;

    // Priority order for IP extraction
    const possibleIPs = [
        headers.get('cf-connecting-ip'),      // Cloudflare
        headers.get('true-client-ip'),        // Cloudflare Enterprise
        headers.get('x-real-ip'),             // nginx
        headers.get('x-forwarded-for')?.split(',')[0]?.trim(),  // Standard proxy
        headers.get('x-vercel-forwarded-for'), // Vercel
    ].filter(Boolean);

    return possibleIPs[0] || 'unknown';
}

/**
 * Log an activity to admin_activity_log
 * Automatically excludes admin@keepplayengine.com (dev account)
 */
export async function logActivity(params: LogActivityParams): Promise<boolean> {
    try {
        const session = await getServerSession(authOptions);

        // Skip logging if no session or if it's the dev account
        if (!session || session.user.email === 'admin@keepplayengine.com') {
            return false;
        }

        const {
            action,
            resourceType,
            resourceId = null,
            description,
            changes = {},
            severity = 'info',
            ipAddress = 'unknown',
            userAgent = null,
        } = params;

        // Insert activity log
        const { error } = await supabaseAdmin
            .from('admin_activity_log')
            .insert({
                admin_user_id: session.user.id,
                action,
                resource_type: resourceType,
                resource_id: resourceId,
                description,
                changes,
                ip_address: ipAddress,
                user_agent: userAgent,
                severity,
            });

        if (error) {
            console.error('Error logging activity:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Failed to log activity:', error);
        return false;
    }
}

/**
 * Log activity with request context
 */
export async function logActivityWithRequest(
    request: Request,
    params: Omit<LogActivityParams, 'ipAddress' | 'userAgent'>
): Promise<boolean> {
    return logActivity({
        ...params,
        ipAddress: getClientIP(request),
        userAgent: request.headers.get('user-agent'),
    });
}
