import { supabaseAdmin } from './supabase';
import type {
    Notification,
    NotificationPreferences,
    Conversation,
    Message,
    NotificationType,
    NotificationPriority,
    AdminUserBasic
} from '@/types/notifications';

// ============================================================
// NOTIFICATION OPERATIONS
// ============================================================

/**
 * Create and send a notification to a user
 */
export async function createNotification({
    recipientId,
    senderId,
    type,
    title,
    message,
    priority = 'normal',
    actionUrl,
    actionLabel,
    relatedEntityType,
    relatedEntityId,
    metadata = {}
}: {
    recipientId: string;
    senderId?: string;
    type: NotificationType;
    title: string;
    message: string;
    priority?: NotificationPriority;
    actionUrl?: string;
    actionLabel?: string;
    relatedEntityType?: string;
    relatedEntityId?: string;
    metadata?: Record<string, unknown>;
}): Promise<Notification | null> {
    const { data, error } = await supabaseAdmin
        .from('notifications')
        .insert({
            recipient_id: recipientId,
            sender_id: senderId || null,
            type,
            title,
            message,
            priority,
            action_url: actionUrl || null,
            action_label: actionLabel || null,
            related_entity_type: relatedEntityType || null,
            related_entity_id: relatedEntityId || null,
            metadata
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating notification:', error);
        return null;
    }

    // Create delivery log entries
    await supabaseAdmin
        .from('notification_delivery_log')
        .insert([
            { notification_id: data.id, channel: 'in_app', status: 'delivered' },
            { notification_id: data.id, channel: 'push', status: 'pending' },
            { notification_id: data.id, channel: 'email', status: 'pending' }
        ]);

    return data;
}

/**
 * Get notifications for a user with sender info
 */
export async function getUserNotifications(
    userId: string,
    options: {
        limit?: number;
        offset?: number;
        unreadOnly?: boolean;
        includeArchived?: boolean;
    } = {}
): Promise<{ notifications: Notification[]; total: number; unread_count: number }> {
    const { limit = 20, offset = 0, unreadOnly = false, includeArchived = false } = options;

    let query = supabaseAdmin
        .from('notifications')
        .select('*, sender:admin_users!notifications_sender_id_fkey(id, email, full_name, avatar_url, role)', { count: 'exact' })
        .eq('recipient_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (unreadOnly) {
        query = query.eq('is_read', false);
    }

    if (!includeArchived) {
        query = query.eq('is_archived', false);
    }

    // Filter expired notifications
    query = query.or('expires_at.is.null,expires_at.gt.now()');

    const { data, error, count } = await query;

    if (error) {
        console.error('Error fetching notifications:', error);
        return { notifications: [], total: 0, unread_count: 0 };
    }

    // Get unread count
    const { count: unreadCount } = await supabaseAdmin
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', userId)
        .eq('is_read', false)
        .eq('is_archived', false)
        .or('expires_at.is.null,expires_at.gt.now()');

    return {
        notifications: data || [],
        total: count || 0,
        unread_count: unreadCount || 0
    };
}

/**
 * Mark notifications as read
 */
export async function markNotificationsAsRead(
    userId: string,
    notificationIds?: string[]
): Promise<number> {
    let query = supabaseAdmin
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('recipient_id', userId)
        .eq('is_read', false);

    if (notificationIds && notificationIds.length > 0) {
        query = query.in('id', notificationIds);
    }

    const { data, error } = await query.select();

    if (error) {
        console.error('Error marking notifications as read:', error);
        return 0;
    }

    return data?.length || 0;
}

/**
 * Archive a notification
 */
export async function archiveNotification(
    userId: string,
    notificationId: string
): Promise<boolean> {
    const { error } = await supabaseAdmin
        .from('notifications')
        .update({
            is_archived: true,
            archived_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
        .eq('id', notificationId)
        .eq('recipient_id', userId);

    if (error) {
        console.error('Error archiving notification:', error);
        return false;
    }

    return true;
}

/**
 * Delete a notification
 */
export async function deleteNotification(
    userId: string,
    notificationId: string
): Promise<boolean> {
    const { error } = await supabaseAdmin
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('recipient_id', userId);

    if (error) {
        console.error('Error deleting notification:', error);
        return false;
    }

    return true;
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabaseAdmin
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', userId)
        .eq('is_read', false)
        .eq('is_archived', false)
        .or('expires_at.is.null,expires_at.gt.now()');

    if (error) {
        console.error('Error getting unread count:', error);
        return 0;
    }

    return count || 0;
}

// ============================================================
// USER OPERATIONS
// ============================================================

/**
 * Get admin user by email
 */
export async function getAdminByEmail(email: string): Promise<AdminUserBasic | null> {
    const { data, error } = await supabaseAdmin
        .from('admin_users')
        .select('id, email, full_name, avatar_url, role')
        .eq('email', email)
        .eq('is_active', true)
        .single();

    if (error) {
        console.error('Error fetching admin user:', error);
        return null;
    }

    return data;
}

/**
 * Get all active admin users (for recipient selection)
 */
export async function getAllAdminUsers(): Promise<AdminUserBasic[]> {
    const { data, error } = await supabaseAdmin
        .from('admin_users')
        .select('id, email, full_name, avatar_url, role')
        .eq('is_active', true)
        .order('full_name');

    if (error) {
        console.error('Error fetching admin users:', error);
        return [];
    }

    return data || [];
}

// ============================================================
// NOTIFICATION PREFERENCES
// ============================================================

/**
 * Get user notification preferences
 */
export async function getNotificationPreferences(
    userId: string
): Promise<NotificationPreferences | null> {
    const { data, error } = await supabaseAdmin
        .from('notification_preferences')
        .select('*')
        .eq('admin_user_id', userId)
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error('Error fetching preferences:', error);
        return null;
    }

    // Create default preferences if not exists
    if (!data) {
        const { data: newPrefs, error: insertError } = await supabaseAdmin
            .from('notification_preferences')
            .insert({ admin_user_id: userId })
            .select()
            .single();

        if (insertError) {
            console.error('Error creating default preferences:', insertError);
            return null;
        }

        return newPrefs;
    }

    return data;
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferences(
    userId: string,
    updates: Partial<Omit<NotificationPreferences, 'id' | 'admin_user_id' | 'created_at' | 'updated_at'>>
): Promise<NotificationPreferences | null> {
    const { data, error } = await supabaseAdmin
        .from('notification_preferences')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('admin_user_id', userId)
        .select()
        .single();

    if (error) {
        console.error('Error updating preferences:', error);
        return null;
    }

    return data;
}

// ============================================================
// CONVERSATION / DIRECT MESSAGING
// ============================================================

/**
 * Get or create a DM conversation between two users
 */
export async function getOrCreateConversation(
    userId1: string,
    userId2: string
): Promise<Conversation | null> {
    // Sort IDs for consistent lookup
    const sortedIds = [userId1, userId2].sort();

    // Try to find existing conversation
    const { data: existing } = await supabaseAdmin
        .from('admin_conversations')
        .select('*')
        .eq('is_group', false)
        .contains('participant_ids', sortedIds)
        .single();

    if (existing) {
        return existing;
    }

    // Create new conversation
    const { data: newConvo, error } = await supabaseAdmin
        .from('admin_conversations')
        .insert({
            participant_ids: sortedIds,
            is_group: false
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating conversation:', error);
        return null;
    }

    // Initialize read status for both users
    await supabaseAdmin
        .from('conversation_read_status')
        .insert([
            { conversation_id: newConvo.id, admin_user_id: userId1 },
            { conversation_id: newConvo.id, admin_user_id: userId2 }
        ]);

    return newConvo;
}

/**
 * Get user's conversations with participant info
 */
export async function getUserConversations(
    userId: string
): Promise<Conversation[]> {
    const { data, error } = await supabaseAdmin
        .from('admin_conversations')
        .select('*')
        .contains('participant_ids', [userId])
        .order('last_message_at', { ascending: false, nullsFirst: false });

    if (error) {
        console.error('Error fetching conversations:', error);
        return [];
    }

    if (!data || data.length === 0) return [];

    // Get all participant IDs
    const allParticipantIds = [...new Set(data.flatMap(c => c.participant_ids))];

    // Fetch participant details
    const { data: participants } = await supabaseAdmin
        .from('admin_users')
        .select('id, email, full_name, avatar_url, role')
        .in('id', allParticipantIds);

    const participantMap = new Map(participants?.map(p => [p.id, p]));

    // Get unread counts per conversation
    const { data: readStatus } = await supabaseAdmin
        .from('conversation_read_status')
        .select('conversation_id, last_read_message_id')
        .eq('admin_user_id', userId);

    const readStatusMap = new Map(readStatus?.map(r => [r.conversation_id, r.last_read_message_id]));

    // Enrich conversations
    return data.map(convo => ({
        ...convo,
        participants: convo.participant_ids
            .filter((id: string) => id !== userId)
            .map((id: string) => participantMap.get(id))
            .filter(Boolean) as AdminUserBasic[],
        // Simple unread detection: has new messages since last read
        unread_count: convo.last_message_id && convo.last_message_id !== readStatusMap.get(convo.id) ? 1 : 0
    }));
}

/**
 * Get messages in a conversation
 */
export async function getConversationMessages(
    conversationId: string,
    options: { limit?: number; before?: string } = {}
): Promise<Message[]> {
    const { limit = 50, before } = options;

    let query = supabaseAdmin
        .from('admin_messages')
        .select('*, sender:admin_users!admin_messages_sender_id_fkey(id, email, full_name, avatar_url, role)')
        .eq('conversation_id', conversationId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (before) {
        query = query.lt('created_at', before);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching messages:', error);
        return [];
    }

    // Return in chronological order
    return (data || []).reverse();
}

/**
 * Send a message in a conversation
 */
export async function sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    contentType: 'text' | 'file' | 'image' | 'link' = 'text',
    attachments: unknown[] = []
): Promise<Message | null> {
    const { data, error } = await supabaseAdmin
        .from('admin_messages')
        .insert({
            conversation_id: conversationId,
            sender_id: senderId,
            content,
            content_type: contentType,
            attachments
        })
        .select('*, sender:admin_users!admin_messages_sender_id_fkey(id, email, full_name, avatar_url, role)')
        .single();

    if (error) {
        console.error('Error sending message:', error);
        return null;
    }

    // Update sender's read status
    await supabaseAdmin
        .from('conversation_read_status')
        .upsert({
            conversation_id: conversationId,
            admin_user_id: senderId,
            last_read_at: new Date().toISOString(),
            last_read_message_id: data.id
        });

    return data;
}

/**
 * Mark conversation as read
 */
export async function markConversationAsRead(
    conversationId: string,
    userId: string,
    lastMessageId: string
): Promise<boolean> {
    const { error } = await supabaseAdmin
        .from('conversation_read_status')
        .upsert({
            conversation_id: conversationId,
            admin_user_id: userId,
            last_read_at: new Date().toISOString(),
            last_read_message_id: lastMessageId
        });

    if (error) {
        console.error('Error marking conversation as read:', error);
        return false;
    }

    return true;
}

// ============================================================
// PUSH SUBSCRIPTION OPERATIONS
// ============================================================

/**
 * Save a push subscription for a user
 */
export async function savePushSubscription(
    userId: string,
    subscription: {
        endpoint: string;
        keys: {
            p256dh: string;
            auth: string;
        };
    },
    deviceInfo?: {
        deviceName?: string;
        deviceType?: string;
        userAgent?: string;
    }
): Promise<boolean> {
    const { error } = await supabaseAdmin
        .from('push_subscriptions')
        .upsert({
            admin_user_id: userId,
            endpoint: subscription.endpoint,
            p256dh_key: subscription.keys.p256dh,
            auth_key: subscription.keys.auth,
            device_name: deviceInfo?.deviceName,
            device_type: deviceInfo?.deviceType,
            user_agent: deviceInfo?.userAgent,
            is_active: true,
            last_used_at: new Date().toISOString(),
            failed_attempts: 0
        }, {
            onConflict: 'endpoint'
        });

    if (error) {
        console.error('Error saving push subscription:', error);
        return false;
    }

    return true;
}

/**
 * Get active push subscriptions for a user
 */
export async function getUserPushSubscriptions(userId: string) {
    const { data, error } = await supabaseAdmin
        .from('push_subscriptions')
        .select('*')
        .eq('admin_user_id', userId)
        .eq('is_active', true);

    if (error) {
        console.error('Error fetching push subscriptions:', error);
        return [];
    }

    return data || [];
}

/**
 * Remove a push subscription
 */
export async function removePushSubscription(
    userId: string,
    subscriptionId: string
): Promise<boolean> {
    const { error } = await supabaseAdmin
        .from('push_subscriptions')
        .delete()
        .eq('id', subscriptionId)
        .eq('admin_user_id', userId);

    if (error) {
        console.error('Error removing push subscription:', error);
        return false;
    }

    return true;
}
