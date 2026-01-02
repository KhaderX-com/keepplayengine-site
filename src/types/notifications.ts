// ============================================================
// NOTIFICATION SYSTEM TYPES
// ============================================================

export type NotificationType =
    | 'direct_message'
    | 'mention'
    | 'task_assigned'
    | 'task_updated'
    | 'task_completed'
    | 'system_alert'
    | 'announcement'
    | 'reminder'
    | 'approval_request'
    | 'approval_response';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export type DeliveryStatus = 'pending' | 'delivered' | 'failed' | 'skipped';

export interface Notification {
    id: string;
    recipient_id: string;
    sender_id: string | null;
    type: NotificationType;
    priority: NotificationPriority;
    title: string;
    message: string;
    action_url: string | null;
    action_label: string | null;
    icon: string | null;
    metadata: Record<string, unknown>;
    related_entity_type: string | null;
    related_entity_id: string | null;
    is_read: boolean;
    read_at: string | null;
    is_archived: boolean;
    archived_at: string | null;
    expires_at: string | null;
    created_at: string;
    updated_at: string;
    // Joined data
    sender?: AdminUserBasic;
}

export interface AdminUserBasic {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    role: string;
}

export interface NotificationPreferences {
    id: string;
    admin_user_id: string;
    in_app_enabled: boolean;
    push_enabled: boolean;
    email_enabled: boolean;
    type_preferences: TypePreferences;
    quiet_hours_enabled: boolean;
    quiet_hours_start: string | null;
    quiet_hours_end: string | null;
    quiet_hours_timezone: string;
    email_digest_enabled: boolean;
    email_digest_frequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
    created_at: string;
    updated_at: string;
}

export interface TypePreferences {
    direct_message: ChannelPreference;
    mention: ChannelPreference;
    task_assigned: ChannelPreference;
    task_updated: ChannelPreference;
    task_completed: ChannelPreference;
    system_alert: ChannelPreference;
    announcement: ChannelPreference;
    reminder: ChannelPreference;
    approval_request: ChannelPreference;
    approval_response: ChannelPreference;
}

export interface ChannelPreference {
    in_app: boolean;
    push: boolean;
    email: boolean;
}

export interface PushSubscription {
    id: string;
    admin_user_id: string;
    endpoint: string;
    p256dh_key: string;
    auth_key: string;
    device_name: string | null;
    device_type: string | null;
    user_agent: string | null;
    is_active: boolean;
    last_used_at: string;
    failed_attempts: number;
    created_at: string;
    updated_at: string;
}

export interface Conversation {
    id: string;
    participant_ids: string[];
    title: string | null;
    is_group: boolean;
    last_message_id: string | null;
    last_message_at: string | null;
    last_message_preview: string | null;
    created_at: string;
    updated_at: string;
    // Joined data
    participants?: AdminUserBasic[];
    unread_count?: number;
}

export interface Message {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    content_type: 'text' | 'file' | 'image' | 'link';
    attachments: MessageAttachment[];
    reactions: Record<string, string[]>;
    is_edited: boolean;
    edited_at: string | null;
    is_deleted: boolean;
    deleted_at: string | null;
    created_at: string;
    // Joined data
    sender?: AdminUserBasic;
}

export interface MessageAttachment {
    url: string;
    name: string;
    type: string;
    size: number;
}

// API Request/Response types
export interface SendNotificationRequest {
    recipient_email: string;
    type: NotificationType;
    title: string;
    message: string;
    priority?: NotificationPriority;
    action_url?: string;
    action_label?: string;
    related_entity_type?: string;
    related_entity_id?: string;
    metadata?: Record<string, unknown>;
}

export interface SendMessageRequest {
    recipient_email: string;
    content: string;
}

export interface NotificationsResponse {
    notifications: Notification[];
    unread_count: number;
    total: number;
}

// Notification icon mapping
export const NOTIFICATION_ICONS: Record<NotificationType, string> = {
    direct_message: '💬',
    mention: '@',
    task_assigned: '📋',
    task_updated: '✏️',
    task_completed: '✅',
    system_alert: '⚠️',
    announcement: '📢',
    reminder: '⏰',
    approval_request: '🔐',
    approval_response: '✓',
};

// Notification priority colors
export const PRIORITY_COLORS: Record<NotificationPriority, string> = {
    low: 'text-gray-500',
    normal: 'text-blue-600',
    high: 'text-orange-500',
    urgent: 'text-red-600',
};

export const PRIORITY_BG_COLORS: Record<NotificationPriority, string> = {
    low: 'bg-gray-100',
    normal: 'bg-blue-50',
    high: 'bg-orange-50',
    urgent: 'bg-red-50',
};
