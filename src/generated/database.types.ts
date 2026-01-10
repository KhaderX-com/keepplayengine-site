export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    // Allows to automatically instantiate createClient with right options
    // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
    __InternalSupabase: {
        PostgrestVersion: "14.1"
    }
    public: {
        Tables: {
            admin_activity_log: {
                Row: {
                    action: string
                    admin_user_id: string
                    changes: Json | null
                    created_at: string
                    description: string | null
                    id: string
                    ip_address: string
                    resource_id: string | null
                    resource_type: string
                    severity: string
                    user_agent: string | null
                }
                Insert: {
                    action: string
                    admin_user_id: string
                    changes?: Json | null
                    created_at?: string
                    description?: string | null
                    id?: string
                    ip_address: string
                    resource_id?: string | null
                    resource_type: string
                    severity?: string
                    user_agent?: string | null
                }
                Update: {
                    action?: string
                    admin_user_id?: string
                    changes?: Json | null
                    created_at?: string
                    description?: string | null
                    id?: string
                    ip_address?: string
                    resource_id?: string | null
                    resource_type?: string
                    severity?: string
                    user_agent?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "admin_activity_log_admin_user_id_fkey"
                        columns: ["admin_user_id"]
                        isOneToOne: false
                        referencedRelation: "admin_users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            admin_conversations: {
                Row: {
                    created_at: string | null
                    id: string
                    is_group: boolean | null
                    last_message_at: string | null
                    last_message_id: string | null
                    last_message_preview: string | null
                    participant_ids: string[]
                    title: string | null
                    updated_at: string | null
                }
                Insert: {
                    created_at?: string | null
                    id?: string
                    is_group?: boolean | null
                    last_message_at?: string | null
                    last_message_id?: string | null
                    last_message_preview?: string | null
                    participant_ids: string[]
                    title?: string | null
                    updated_at?: string | null
                }
                Update: {
                    created_at?: string | null
                    id?: string
                    is_group?: boolean | null
                    last_message_at?: string | null
                    last_message_id?: string | null
                    last_message_preview?: string | null
                    participant_ids?: string[]
                    title?: string | null
                    updated_at?: string | null
                }
                Relationships: []
            }
            admin_login_attempts: {
                Row: {
                    admin_user_id: string | null
                    attempt_type: string
                    created_at: string
                    device_info: Json | null
                    email: string
                    failure_reason: string | null
                    geo_location: Json | null
                    id: string
                    ip_address: string
                    success: boolean
                    user_agent: string | null
                }
                Insert: {
                    admin_user_id?: string | null
                    attempt_type?: string
                    created_at?: string
                    device_info?: Json | null
                    email: string
                    failure_reason?: string | null
                    geo_location?: Json | null
                    id?: string
                    ip_address: string
                    success: boolean
                    user_agent?: string | null
                }
                Update: {
                    admin_user_id?: string | null
                    attempt_type?: string
                    created_at?: string
                    device_info?: Json | null
                    email?: string
                    failure_reason?: string | null
                    geo_location?: Json | null
                    id?: string
                    ip_address?: string
                    success?: boolean
                    user_agent?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "admin_login_attempts_admin_user_id_fkey"
                        columns: ["admin_user_id"]
                        isOneToOne: false
                        referencedRelation: "admin_users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            admin_messages: {
                Row: {
                    attachments: Json | null
                    content: string
                    content_type: string | null
                    conversation_id: string
                    created_at: string | null
                    deleted_at: string | null
                    edited_at: string | null
                    id: string
                    is_deleted: boolean | null
                    is_edited: boolean | null
                    reactions: Json | null
                    sender_id: string
                }
                Insert: {
                    attachments?: Json | null
                    content: string
                    content_type?: string | null
                    conversation_id: string
                    created_at?: string | null
                    deleted_at?: string | null
                    edited_at?: string | null
                    id?: string
                    is_deleted?: boolean | null
                    is_edited?: boolean | null
                    reactions?: Json | null
                    sender_id: string
                }
                Update: {
                    attachments?: Json | null
                    content?: string
                    content_type?: string | null
                    conversation_id?: string
                    created_at?: string | null
                    deleted_at?: string | null
                    edited_at?: string | null
                    id?: string
                    is_deleted?: boolean | null
                    is_edited?: boolean | null
                    reactions?: Json | null
                    sender_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "admin_messages_conversation_id_fkey"
                        columns: ["conversation_id"]
                        isOneToOne: false
                        referencedRelation: "admin_conversations"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "admin_messages_sender_id_fkey"
                        columns: ["sender_id"]
                        isOneToOne: false
                        referencedRelation: "admin_users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            admin_password_resets: {
                Row: {
                    admin_user_id: string
                    created_at: string
                    expires_at: string
                    id: string
                    ip_address: string
                    token_hash: string
                    used_at: string | null
                }
                Insert: {
                    admin_user_id: string
                    created_at?: string
                    expires_at: string
                    id?: string
                    ip_address: string
                    token_hash: string
                    used_at?: string | null
                }
                Update: {
                    admin_user_id?: string
                    created_at?: string
                    expires_at?: string
                    id?: string
                    ip_address?: string
                    token_hash?: string
                    used_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "admin_password_resets_admin_user_id_fkey"
                        columns: ["admin_user_id"]
                        isOneToOne: false
                        referencedRelation: "admin_users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            admin_roles: {
                Row: {
                    created_at: string
                    description: string | null
                    display_name: string
                    id: string
                    is_system_role: boolean
                    name: Database["public"]["Enums"]["admin_role_type"]
                    permissions: Json
                    updated_at: string
                }
                Insert: {
                    created_at?: string
                    description?: string | null
                    display_name: string
                    id?: string
                    is_system_role?: boolean
                    name: Database["public"]["Enums"]["admin_role_type"]
                    permissions?: Json
                    updated_at?: string
                }
                Update: {
                    created_at?: string
                    description?: string | null
                    display_name?: string
                    id?: string
                    is_system_role?: boolean
                    name?: Database["public"]["Enums"]["admin_role_type"]
                    permissions?: Json
                    updated_at?: string
                }
                Relationships: []
            }
            admin_sessions: {
                Row: {
                    admin_user_id: string
                    created_at: string
                    device_info: Json | null
                    expires_at: string
                    id: string
                    ip_address: string
                    is_revoked: boolean
                    last_activity_at: string
                    revoked_at: string | null
                    revoked_reason: string | null
                    session_token: string
                    user_agent: string | null
                }
                Insert: {
                    admin_user_id: string
                    created_at?: string
                    device_info?: Json | null
                    expires_at: string
                    id?: string
                    ip_address: string
                    is_revoked?: boolean
                    last_activity_at?: string
                    revoked_at?: string | null
                    revoked_reason?: string | null
                    session_token: string
                    user_agent?: string | null
                }
                Update: {
                    admin_user_id?: string
                    created_at?: string
                    device_info?: Json | null
                    expires_at?: string
                    id?: string
                    ip_address?: string
                    is_revoked?: boolean
                    last_activity_at?: string
                    revoked_at?: string | null
                    revoked_reason?: string | null
                    session_token?: string
                    user_agent?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "admin_sessions_admin_user_id_fkey"
                        columns: ["admin_user_id"]
                        isOneToOne: false
                        referencedRelation: "admin_users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            admin_users: {
                Row: {
                    avatar_url: string | null
                    backup_codes: string[] | null
                    biometric_enabled: boolean
                    created_at: string
                    created_by: string | null
                    email: string
                    email_verified: string | null
                    full_name: string | null
                    id: string
                    is_active: boolean
                    is_locked: boolean
                    last_login_at: string | null
                    last_login_ip: string | null
                    lock_reason: string | null
                    locked_until: string | null
                    metadata: Json | null
                    must_change_password: boolean
                    password_changed_at: string
                    password_hash: string
                    role: Database["public"]["Enums"]["admin_role_type"]
                    two_factor_enabled: boolean
                    two_factor_secret: string | null
                    updated_at: string
                }
                Insert: {
                    avatar_url?: string | null
                    backup_codes?: string[] | null
                    biometric_enabled?: boolean
                    created_at?: string
                    created_by?: string | null
                    email: string
                    email_verified?: string | null
                    full_name?: string | null
                    id?: string
                    is_active?: boolean
                    is_locked?: boolean
                    last_login_at?: string | null
                    last_login_ip?: string | null
                    lock_reason?: string | null
                    locked_until?: string | null
                    metadata?: Json | null
                    must_change_password?: boolean
                    password_changed_at?: string
                    password_hash: string
                    role?: Database["public"]["Enums"]["admin_role_type"]
                    two_factor_enabled?: boolean
                    two_factor_secret?: string | null
                    updated_at?: string
                }
                Update: {
                    avatar_url?: string | null
                    backup_codes?: string[] | null
                    biometric_enabled?: boolean
                    created_at?: string
                    created_by?: string | null
                    email?: string
                    email_verified?: string | null
                    full_name?: string | null
                    id?: string
                    is_active?: boolean
                    is_locked?: boolean
                    last_login_at?: string | null
                    last_login_ip?: string | null
                    lock_reason?: string | null
                    locked_until?: string | null
                    metadata?: Json | null
                    must_change_password?: boolean
                    password_changed_at?: string
                    password_hash?: string
                    role?: Database["public"]["Enums"]["admin_role_type"]
                    two_factor_enabled?: boolean
                    two_factor_secret?: string | null
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "admin_users_created_by_fkey"
                        columns: ["created_by"]
                        isOneToOne: false
                        referencedRelation: "admin_users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            biometric_config: {
                Row: {
                    allow_enrollment: boolean
                    biometric_enabled: boolean
                    id: string
                    notes: string | null
                    updated_at: string
                    updated_by: string | null
                }
                Insert: {
                    allow_enrollment?: boolean
                    biometric_enabled?: boolean
                    id?: string
                    notes?: string | null
                    updated_at?: string
                    updated_by?: string | null
                }
                Update: {
                    allow_enrollment?: boolean
                    biometric_enabled?: boolean
                    id?: string
                    notes?: string | null
                    updated_at?: string
                    updated_by?: string | null
                }
                Relationships: []
            }
            conversation_read_status: {
                Row: {
                    admin_user_id: string
                    conversation_id: string
                    id: string
                    last_read_at: string | null
                    last_read_message_id: string | null
                }
                Insert: {
                    admin_user_id: string
                    conversation_id: string
                    id?: string
                    last_read_at?: string | null
                    last_read_message_id?: string | null
                }
                Update: {
                    admin_user_id?: string
                    conversation_id?: string
                    id?: string
                    last_read_at?: string | null
                    last_read_message_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "conversation_read_status_admin_user_id_fkey"
                        columns: ["admin_user_id"]
                        isOneToOne: false
                        referencedRelation: "admin_users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "conversation_read_status_conversation_id_fkey"
                        columns: ["conversation_id"]
                        isOneToOne: false
                        referencedRelation: "admin_conversations"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "conversation_read_status_last_read_message_id_fkey"
                        columns: ["last_read_message_id"]
                        isOneToOne: false
                        referencedRelation: "admin_messages"
                        referencedColumns: ["id"]
                    },
                ]
            }
            notification_delivery_log: {
                Row: {
                    channel: string
                    created_at: string | null
                    delivered_at: string | null
                    email_message_id: string | null
                    error_message: string | null
                    id: string
                    notification_id: string
                    push_subscription_id: string | null
                    retry_count: number | null
                    status: Database["public"]["Enums"]["delivery_status"] | null
                }
                Insert: {
                    channel: string
                    created_at?: string | null
                    delivered_at?: string | null
                    email_message_id?: string | null
                    error_message?: string | null
                    id?: string
                    notification_id: string
                    push_subscription_id?: string | null
                    retry_count?: number | null
                    status?: Database["public"]["Enums"]["delivery_status"] | null
                }
                Update: {
                    channel?: string
                    created_at?: string | null
                    delivered_at?: string | null
                    email_message_id?: string | null
                    error_message?: string | null
                    id?: string
                    notification_id?: string
                    push_subscription_id?: string | null
                    retry_count?: number | null
                    status?: Database["public"]["Enums"]["delivery_status"] | null
                }
                Relationships: [
                    {
                        foreignKeyName: "notification_delivery_log_notification_id_fkey"
                        columns: ["notification_id"]
                        isOneToOne: false
                        referencedRelation: "notifications"
                        referencedColumns: ["id"]
                    },
                ]
            }
            notification_preferences: {
                Row: {
                    admin_user_id: string
                    created_at: string | null
                    email_digest_enabled: boolean | null
                    email_digest_frequency: string | null
                    email_enabled: boolean | null
                    id: string
                    in_app_enabled: boolean | null
                    push_enabled: boolean | null
                    quiet_hours_enabled: boolean | null
                    quiet_hours_end: string | null
                    quiet_hours_start: string | null
                    quiet_hours_timezone: string | null
                    type_preferences: Json | null
                    updated_at: string | null
                }
                Insert: {
                    admin_user_id: string
                    created_at?: string | null
                    email_digest_enabled?: boolean | null
                    email_digest_frequency?: string | null
                    email_enabled?: boolean | null
                    id?: string
                    in_app_enabled?: boolean | null
                    push_enabled?: boolean | null
                    quiet_hours_enabled?: boolean | null
                    quiet_hours_end?: string | null
                    quiet_hours_start?: string | null
                    quiet_hours_timezone?: string | null
                    type_preferences?: Json | null
                    updated_at?: string | null
                }
                Update: {
                    admin_user_id?: string
                    created_at?: string | null
                    email_digest_enabled?: boolean | null
                    email_digest_frequency?: string | null
                    email_enabled?: boolean | null
                    id?: string
                    in_app_enabled?: boolean | null
                    push_enabled?: boolean | null
                    quiet_hours_enabled?: boolean | null
                    quiet_hours_end?: string | null
                    quiet_hours_start?: string | null
                    quiet_hours_timezone?: string | null
                    type_preferences?: Json | null
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "notification_preferences_admin_user_id_fkey"
                        columns: ["admin_user_id"]
                        isOneToOne: true
                        referencedRelation: "admin_users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            notifications: {
                Row: {
                    action_label: string | null
                    action_url: string | null
                    archived_at: string | null
                    created_at: string | null
                    expires_at: string | null
                    icon: string | null
                    id: string
                    is_archived: boolean | null
                    is_read: boolean | null
                    message: string
                    metadata: Json | null
                    priority: Database["public"]["Enums"]["notification_priority"] | null
                    read_at: string | null
                    recipient_id: string
                    related_entity_id: string | null
                    related_entity_type: string | null
                    sender_id: string | null
                    title: string
                    type: Database["public"]["Enums"]["notification_type"]
                    updated_at: string | null
                }
                Insert: {
                    action_label?: string | null
                    action_url?: string | null
                    archived_at?: string | null
                    created_at?: string | null
                    expires_at?: string | null
                    icon?: string | null
                    id?: string
                    is_archived?: boolean | null
                    is_read?: boolean | null
                    message: string
                    metadata?: Json | null
                    priority?: Database["public"]["Enums"]["notification_priority"] | null
                    read_at?: string | null
                    recipient_id: string
                    related_entity_id?: string | null
                    related_entity_type?: string | null
                    sender_id?: string | null
                    title: string
                    type: Database["public"]["Enums"]["notification_type"]
                    updated_at?: string | null
                }
                Update: {
                    action_label?: string | null
                    action_url?: string | null
                    archived_at?: string | null
                    created_at?: string | null
                    expires_at?: string | null
                    icon?: string | null
                    id?: string
                    is_archived?: boolean | null
                    is_read?: boolean | null
                    message?: string
                    metadata?: Json | null
                    priority?: Database["public"]["Enums"]["notification_priority"] | null
                    read_at?: string | null
                    recipient_id?: string
                    related_entity_id?: string | null
                    related_entity_type?: string | null
                    sender_id?: string | null
                    title?: string
                    type?: Database["public"]["Enums"]["notification_type"]
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "notifications_recipient_id_fkey"
                        columns: ["recipient_id"]
                        isOneToOne: false
                        referencedRelation: "admin_users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "notifications_sender_id_fkey"
                        columns: ["sender_id"]
                        isOneToOne: false
                        referencedRelation: "admin_users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            push_subscriptions: {
                Row: {
                    admin_user_id: string
                    auth_key: string
                    created_at: string | null
                    device_name: string | null
                    device_type: string | null
                    endpoint: string
                    failed_attempts: number | null
                    id: string
                    is_active: boolean | null
                    last_used_at: string | null
                    p256dh_key: string
                    updated_at: string | null
                    user_agent: string | null
                }
                Insert: {
                    admin_user_id: string
                    auth_key: string
                    created_at?: string | null
                    device_name?: string | null
                    device_type?: string | null
                    endpoint: string
                    failed_attempts?: number | null
                    id?: string
                    is_active?: boolean | null
                    last_used_at?: string | null
                    p256dh_key: string
                    updated_at?: string | null
                    user_agent?: string | null
                }
                Update: {
                    admin_user_id?: string
                    auth_key?: string
                    created_at?: string | null
                    device_name?: string | null
                    device_type?: string | null
                    endpoint?: string
                    failed_attempts?: number | null
                    id?: string
                    is_active?: boolean | null
                    last_used_at?: string | null
                    p256dh_key?: string
                    updated_at?: string | null
                    user_agent?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "push_subscriptions_admin_user_id_fkey"
                        columns: ["admin_user_id"]
                        isOneToOne: false
                        referencedRelation: "admin_users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            task_activity_log: {
                Row: {
                    action: string
                    actor_id: string | null
                    created_at: string | null
                    field_changed: string | null
                    id: string
                    metadata: Json | null
                    new_value: string | null
                    old_value: string | null
                    task_id: string
                }
                Insert: {
                    action: string
                    actor_id?: string | null
                    created_at?: string | null
                    field_changed?: string | null
                    id?: string
                    metadata?: Json | null
                    new_value?: string | null
                    old_value?: string | null
                    task_id: string
                }
                Update: {
                    action?: string
                    actor_id?: string | null
                    created_at?: string | null
                    field_changed?: string | null
                    id?: string
                    metadata?: Json | null
                    new_value?: string | null
                    old_value?: string | null
                    task_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "task_activity_log_actor_id_fkey"
                        columns: ["actor_id"]
                        isOneToOne: false
                        referencedRelation: "team_members"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "task_activity_log_task_id_fkey"
                        columns: ["task_id"]
                        isOneToOne: false
                        referencedRelation: "tasks"
                        referencedColumns: ["id"]
                    },
                ]
            }
            task_comments: {
                Row: {
                    author_id: string | null
                    content: string
                    created_at: string | null
                    id: string
                    task_id: string
                    updated_at: string | null
                }
                Insert: {
                    author_id?: string | null
                    content: string
                    created_at?: string | null
                    id?: string
                    task_id: string
                    updated_at?: string | null
                }
                Update: {
                    author_id?: string | null
                    content?: string
                    created_at?: string | null
                    id?: string
                    task_id?: string
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "task_comments_author_id_fkey"
                        columns: ["author_id"]
                        isOneToOne: false
                        referencedRelation: "team_members"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "task_comments_task_id_fkey"
                        columns: ["task_id"]
                        isOneToOne: false
                        referencedRelation: "tasks"
                        referencedColumns: ["id"]
                    },
                ]
            }
            task_label_assignments: {
                Row: {
                    created_at: string | null
                    label_id: string
                    task_id: string
                }
                Insert: {
                    created_at?: string | null
                    label_id: string
                    task_id: string
                }
                Update: {
                    created_at?: string | null
                    label_id?: string
                    task_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "task_label_assignments_label_id_fkey"
                        columns: ["label_id"]
                        isOneToOne: false
                        referencedRelation: "task_labels"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "task_label_assignments_task_id_fkey"
                        columns: ["task_id"]
                        isOneToOne: false
                        referencedRelation: "tasks"
                        referencedColumns: ["id"]
                    },
                ]
            }
            task_labels: {
                Row: {
                    color: string
                    created_at: string | null
                    description: string | null
                    id: string
                    name: string
                }
                Insert: {
                    color?: string
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    name: string
                }
                Update: {
                    color?: string
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    name?: string
                }
                Relationships: []
            }
            tasks: {
                Row: {
                    actual_hours: number | null
                    assignee_id: string | null
                    color: string | null
                    completed_at: string | null
                    created_at: string | null
                    created_by: string | null
                    description: string | null
                    due_date: string | null
                    estimated_hours: number | null
                    id: string
                    parent_task_id: string | null
                    position: number | null
                    priority: Database["public"]["Enums"]["task_priority"] | null
                    status: Database["public"]["Enums"]["task_status"] | null
                    title: string
                    updated_at: string | null
                }
                Insert: {
                    actual_hours?: number | null
                    assignee_id?: string | null
                    color?: string | null
                    completed_at?: string | null
                    created_at?: string | null
                    created_by?: string | null
                    description?: string | null
                    due_date?: string | null
                    estimated_hours?: number | null
                    id?: string
                    parent_task_id?: string | null
                    position?: number | null
                    priority?: Database["public"]["Enums"]["task_priority"] | null
                    status?: Database["public"]["Enums"]["task_status"] | null
                    title: string
                    updated_at?: string | null
                }
                Update: {
                    actual_hours?: number | null
                    assignee_id?: string | null
                    color?: string | null
                    completed_at?: string | null
                    created_at?: string | null
                    created_by?: string | null
                    description?: string | null
                    due_date?: string | null
                    estimated_hours?: number | null
                    id?: string
                    parent_task_id?: string | null
                    position?: number | null
                    priority?: Database["public"]["Enums"]["task_priority"] | null
                    status?: Database["public"]["Enums"]["task_status"] | null
                    title?: string
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "tasks_assignee_id_fkey"
                        columns: ["assignee_id"]
                        isOneToOne: false
                        referencedRelation: "team_members"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "tasks_created_by_fkey"
                        columns: ["created_by"]
                        isOneToOne: false
                        referencedRelation: "team_members"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "tasks_parent_task_id_fkey"
                        columns: ["parent_task_id"]
                        isOneToOne: false
                        referencedRelation: "tasks"
                        referencedColumns: ["id"]
                    },
                ]
            }
            team_members: {
                Row: {
                    admin_user_id: string | null
                    avatar_url: string | null
                    color: string | null
                    created_at: string | null
                    email: string | null
                    id: string
                    is_active: boolean | null
                    name: string
                    updated_at: string | null
                }
                Insert: {
                    admin_user_id?: string | null
                    avatar_url?: string | null
                    color?: string | null
                    created_at?: string | null
                    email?: string | null
                    id?: string
                    is_active?: boolean | null
                    name: string
                    updated_at?: string | null
                }
                Update: {
                    admin_user_id?: string | null
                    avatar_url?: string | null
                    color?: string | null
                    created_at?: string | null
                    email?: string | null
                    id?: string
                    is_active?: boolean | null
                    name?: string
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "team_members_admin_user_id_fkey"
                        columns: ["admin_user_id"]
                        isOneToOne: false
                        referencedRelation: "admin_users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            webauthn_credentials: {
                Row: {
                    counter: number
                    created_at: string
                    credential_id: string
                    device_name: string | null
                    device_type: string | null
                    id: string
                    last_used_at: string
                    public_key: string
                    transports: string[] | null
                    user_id: string
                }
                Insert: {
                    counter?: number
                    created_at?: string
                    credential_id: string
                    device_name?: string | null
                    device_type?: string | null
                    id?: string
                    last_used_at?: string
                    public_key: string
                    transports?: string[] | null
                    user_id: string
                }
                Update: {
                    counter?: number
                    created_at?: string
                    credential_id?: string
                    device_name?: string | null
                    device_type?: string | null
                    id?: string
                    last_used_at?: string
                    public_key?: string
                    transports?: string[] | null
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "webauthn_credentials_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "admin_users"
                        referencedColumns: ["id"]
                    },
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            create_notification: {
                Args: {
                    p_action_label?: string
                    p_action_url?: string
                    p_message: string
                    p_metadata?: Json
                    p_priority?: Database["public"]["Enums"]["notification_priority"]
                    p_recipient_id: string
                    p_related_entity_id?: string
                    p_related_entity_type?: string
                    p_sender_id: string
                    p_title: string
                    p_type: Database["public"]["Enums"]["notification_type"]
                }
                Returns: string
            }
            get_or_create_dm_conversation: {
                Args: { p_user1_id: string; p_user2_id: string }
                Returns: string
            }
            get_unread_notification_count: {
                Args: { p_user_id: string }
                Returns: number
            }
            mark_notifications_read: {
                Args: { p_notification_ids?: string[]; p_user_id: string }
                Returns: number
            }
        }
        Enums: {
            admin_role_type: "SUPER_ADMIN" | "ADMIN" | "MODERATOR" | "VIEWER"
            delivery_status: "pending" | "delivered" | "failed" | "skipped"
            notification_priority: "low" | "normal" | "high" | "urgent"
            notification_type:
            | "direct_message"
            | "mention"
            | "task_assigned"
            | "task_updated"
            | "task_completed"
            | "system_alert"
            | "announcement"
            | "reminder"
            | "approval_request"
            | "approval_response"
            permission_category:
            | "USER_MANAGEMENT"
            | "CONTENT_MANAGEMENT"
            | "SYSTEM_SETTINGS"
            | "ANALYTICS"
            | "SECURITY"
            | "API_ACCESS"
            task_priority: "low" | "medium" | "high" | "urgent"
            task_status: "todo" | "in_progress" | "done"
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
    DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
            Row: infer R
        }
    ? R
    : never
    : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
            Row: infer R
        }
    ? R
    : never
    : never

export type TablesInsert<
    DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Insert: infer I
    }
    ? I
    : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
    }
    ? I
    : never
    : never

export type TablesUpdate<
    DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Update: infer U
    }
    ? U
    : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
    }
    ? U
    : never
    : never

export type Enums<
    DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
    EnumName extends DefaultSchemaEnumNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
    : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
    PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
    CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
    : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
    public: {
        Enums: {
            admin_role_type: ["SUPER_ADMIN", "ADMIN", "MODERATOR", "VIEWER"],
            delivery_status: ["pending", "delivered", "failed", "skipped"],
            notification_priority: ["low", "normal", "high", "urgent"],
            notification_type: [
                "direct_message",
                "mention",
                "task_assigned",
                "task_updated",
                "task_completed",
                "system_alert",
                "announcement",
                "reminder",
                "approval_request",
                "approval_response",
            ],
            permission_category: [
                "USER_MANAGEMENT",
                "CONTENT_MANAGEMENT",
                "SYSTEM_SETTINGS",
                "ANALYTICS",
                "SECURITY",
                "API_ACCESS",
            ],
            task_priority: ["low", "medium", "high", "urgent"],
            task_status: ["todo", "in_progress", "done"],
        },
    },
} as const
