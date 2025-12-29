import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Only initialize admin client on server-side
// This prevents client-side bundle from including sensitive keys
let _supabaseAdmin: SupabaseClient | null = null;

function getSupabaseAdmin(): SupabaseClient {
    // Check if running on server-side
    if (typeof window !== 'undefined') {
        throw new Error('supabaseAdmin can only be used on the server-side');
    }

    if (!supabaseUrl) {
        throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
    }

    if (!supabaseServiceKey) {
        throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
    }

    if (!_supabaseAdmin) {
        _supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });
    }

    return _supabaseAdmin;
}

// Export as a proxy that throws helpful error if used client-side
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
    get(_target, prop) {
        const admin = getSupabaseAdmin();
        return admin[prop as keyof SupabaseClient];
    }
});

// ==================================================
// ADMIN PANEL TYPE DEFINITIONS
// ==================================================

export type AdminRoleType = 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR' | 'VIEWER';

export type PermissionCategory =
    | 'USER_MANAGEMENT'
    | 'CONTENT_MANAGEMENT'
    | 'SYSTEM_SETTINGS'
    | 'ANALYTICS'
    | 'SECURITY'
    | 'API_ACCESS';

export interface AdminUser {
    id: string;
    email: string;
    email_verified: string | null;
    password_hash: string;
    full_name: string | null;
    avatar_url: string | null;
    role: AdminRoleType;
    is_active: boolean;
    is_locked: boolean;
    lock_reason: string | null;
    locked_until: string | null;
    last_login_at: string | null;
    last_login_ip: string | null;
    password_changed_at: string;
    must_change_password: boolean;
    two_factor_enabled: boolean;
    two_factor_secret: string | null;
    backup_codes: string[] | null;
    metadata: Record<string, unknown>;
    created_at: string;
    updated_at: string;
    created_by: string | null;
}

export interface AdminSession {
    id: string;
    admin_user_id: string;
    session_token: string;
    ip_address: string;
    user_agent: string | null;
    device_info: Record<string, unknown>;
    expires_at: string;
    last_activity_at: string;
    is_revoked: boolean;
    revoked_at: string | null;
    revoked_reason: string | null;
    created_at: string;
}

export interface AdminLoginAttempt {
    id: string;
    admin_user_id: string | null;
    email: string;
    ip_address: string;
    user_agent: string | null;
    device_info: Record<string, unknown>;
    attempt_type: string;
    success: boolean;
    failure_reason: string | null;
    geo_location: Record<string, unknown>;
    created_at: string;
}

export interface AdminActivityLog {
    id: string;
    admin_user_id: string;
    action: string;
    resource_type: string;
    resource_id: string | null;
    description: string | null;
    changes: Record<string, unknown>;
    ip_address: string;
    user_agent: string | null;
    severity: 'info' | 'warning' | 'critical';
    created_at: string;
}

export interface AdminRole {
    id: string;
    name: AdminRoleType;
    display_name: string;
    description: string | null;
    permissions: string[];
    is_system_role: boolean;
    created_at: string;
    updated_at: string;
}

export interface AdminPasswordReset {
    id: string;
    admin_user_id: string;
    token_hash: string;
    expires_at: string;
    used_at: string | null;
    ip_address: string;
    created_at: string;
}

// ==================================================
// APPLICATION USER TYPE
// ==================================================
// Will be defined when app development starts
