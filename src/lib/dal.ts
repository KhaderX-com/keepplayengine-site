import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { SignJWT } from "jose";
import { supabaseAdmin } from "./supabase";

// ─────────────────────────────────────────────
// User-scoped Supabase client (respects RLS)
// ─────────────────────────────────────────────

/**
 * Create a Supabase client scoped to a specific admin user via JWT.
 * This client respects RLS policies — the database enforces access control.
 */
export function createUserClient(userJwt: string): SupabaseClient {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
        throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
    }

    return createClient(url, anonKey, {
        global: {
            headers: { Authorization: `Bearer ${userJwt}` },
        },
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}

// ─────────────────────────────────────────────
// JWT Minting
// ─────────────────────────────────────────────

/**
 * Mint a short-lived JWT for the admin user with their role as a custom claim.
 * The JWT is signed with SUPABASE_JWT_SECRET so Supabase trusts it for RLS.
 * TTL: 5 minutes (enough for a single request lifecycle).
 */
export async function mintAdminJwt(
    userId: string,
    role: string,
): Promise<string> {
    const jwtSecret = process.env.SUPABASE_JWT_SECRET;
    if (!jwtSecret) {
        throw new Error("Missing SUPABASE_JWT_SECRET environment variable");
    }

    const secret = new TextEncoder().encode(jwtSecret);

    return new SignJWT({
        sub: userId,
        admin_role: role,
        role: "authenticated",
        iss: "supabase",
        aud: "authenticated",
    })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("5m")
        .sign(secret);
}

// ─────────────────────────────────────────────
// Helper: get a user-scoped client from session info
// ─────────────────────────────────────────────
export async function getUserClient(userId: string, role: string): Promise<SupabaseClient> {
    const jwt = await mintAdminJwt(userId, role);
    return createUserClient(jwt);
}

// ─────────────────────────────────────────────
// Data Access Layer — Tasks
// ─────────────────────────────────────────────
export const TasksDAL = {
    async list(client: SupabaseClient, filters: {
        status?: string | string[];
        priority?: string | string[];
        assignee_id?: string;
        label_id?: string;
        parent_task_id?: string | null;
        search?: string;
        onlyTopLevel?: boolean;
    }) {
        let query = client
            .from("tasks")
            .select(`
                *,
                assignee:team_members!tasks_assignee_id_fkey(*),
                creator:team_members!tasks_created_by_fkey(*)
            `)
            .order("position", { ascending: true })
            .order("created_at", { ascending: false });

        if (filters.status) {
            if (Array.isArray(filters.status)) {
                query = query.in("status", filters.status);
            } else {
                query = query.eq("status", filters.status);
            }
        }
        if (filters.priority) {
            if (Array.isArray(filters.priority)) {
                query = query.in("priority", filters.priority);
            } else {
                query = query.eq("priority", filters.priority);
            }
        }
        if (filters.assignee_id) {
            query = query.eq("assignee_id", filters.assignee_id);
        }
        if (filters.search) {
            // Escape LIKE metacharacters to prevent pattern injection (C-05/M-16)
            const safeSearch = filters.search.replace(/[%_\\]/g, "\\$&");
            query = query.or(`title.ilike.%${safeSearch}%,description.ilike.%${safeSearch}%`);
        }
        if (filters.onlyTopLevel && !filters.parent_task_id) {
            query = query.is("parent_task_id", null);
        } else if (filters.parent_task_id) {
            query = query.eq("parent_task_id", filters.parent_task_id);
        }

        return query;
    },

    async getById(client: SupabaseClient, id: string) {
        return client.from("tasks").select(`
            *,
            assignee:team_members!tasks_assignee_id_fkey(*),
            creator:team_members!tasks_created_by_fkey(*)
        `).eq("id", id).single();
    },

    async create(client: SupabaseClient, data: Record<string, unknown>) {
        return client
            .from("tasks")
            .insert(data)
            .select(`
                *,
                assignee:team_members!tasks_assignee_id_fkey(*),
                creator:team_members!tasks_created_by_fkey(*)
            `)
            .single();
    },

    async update(client: SupabaseClient, id: string, data: Record<string, unknown>) {
        return client
            .from("tasks")
            .update(data)
            .eq("id", id)
            .select(`
                *,
                assignee:team_members!tasks_assignee_id_fkey(*),
                creator:team_members!tasks_created_by_fkey(*)
            `)
            .single();
    },

    async delete(client: SupabaseClient, id: string) {
        return client.from("tasks").delete().eq("id", id);
    },

    async getLabels(client: SupabaseClient, taskIds: string[]) {
        return client
            .from("task_label_assignments")
            .select("task_id, label:task_labels(*)")
            .in("task_id", taskIds);
    },

    async getAssignees(client: SupabaseClient, taskIds: string[]) {
        return client
            .from("task_assignees")
            .select("task_id, team_member:team_members(*)")
            .in("task_id", taskIds);
    },

    async setAssignees(client: SupabaseClient, taskId: string, memberIds: string[]) {
        return client
            .from("task_assignees")
            .insert(memberIds.map((id) => ({ task_id: taskId, team_member_id: id })));
    },

    async setLabels(client: SupabaseClient, taskId: string, labelIds: string[]) {
        // Remove existing
        await client.from("task_label_assignments").delete().eq("task_id", taskId);
        if (labelIds.length === 0) return { error: null };
        return client
            .from("task_label_assignments")
            .insert(labelIds.map((id) => ({ task_id: taskId, label_id: id })));
    },

    async assignLabels(client: SupabaseClient, taskId: string, labelIds: string[]) {
        return client
            .from("task_label_assignments")
            .insert(labelIds.map((id) => ({ task_id: taskId, label_id: id })));
    },

    async getSubtasks(client: SupabaseClient, parentIds: string[]) {
        return client
            .from("tasks")
            .select("*, assignee:team_members!tasks_assignee_id_fkey(*)")
            .in("parent_task_id", parentIds)
            .order("position", { ascending: true });
    },

    async getMaxPosition(client: SupabaseClient, status: string, parentTaskId: string | null) {
        let query = client
            .from("tasks")
            .select("position")
            .eq("status", status)
            .order("position", { ascending: false })
            .limit(1)
            .single();

        if (parentTaskId) {
            query = client
                .from("tasks")
                .select("position")
                .eq("status", status)
                .eq("parent_task_id", parentTaskId)
                .order("position", { ascending: false })
                .limit(1)
                .single();
        } else {
            query = client
                .from("tasks")
                .select("position")
                .eq("status", status)
                .is("parent_task_id", null)
                .order("position", { ascending: false })
                .limit(1)
                .single();
        }

        return query;
    },

    async getComments(client: SupabaseClient, taskId: string) {
        return client
            .from("task_comments")
            .select("*, author:team_members(*)")
            .eq("task_id", taskId)
            .order("created_at", { ascending: true });
    },

    async addComment(client: SupabaseClient, data: {
        task_id: string;
        content: string;
        author_id: string | null;
    }) {
        return client.from("task_comments").insert(data).select("*, author:team_members(*)").single();
    },

    async getActivityLog(client: SupabaseClient, taskId: string, limit = 20) {
        return client
            .from("task_activity_log")
            .select("*, actor:team_members(*), admin_user:admin_users(id, full_name, email, avatar_url)")
            .eq("task_id", taskId)
            .order("created_at", { ascending: false })
            .limit(limit);
    },

    async logActivity(client: SupabaseClient, data: {
        task_id: string;
        actor_id?: string | null;
        admin_user_id?: string | null;
        action: string;
        field_changed?: string | null;
        old_value?: string | null;
        new_value?: string | null;
        metadata?: Record<string, unknown>;
    }) {
        return client.from("task_activity_log").insert(data);
    },

    async logActivityBatch(client: SupabaseClient, data: Array<{
        task_id: string;
        actor_id?: string | null;
        admin_user_id?: string | null;
        action: string;
        field_changed?: string | null;
        old_value?: string | null;
        new_value?: string | null;
        metadata?: Record<string, unknown>;
    }>) {
        return client.from("task_activity_log").insert(data);
    },
};

// ─────────────────────────────────────────────
// Data Access Layer — Labels
// ─────────────────────────────────────────────
export const LabelsDAL = {
    async list(client: SupabaseClient) {
        return client
            .from("task_labels")
            .select("*")
            .order("name", { ascending: true });
    },

    async create(client: SupabaseClient, data: { name: string; color: string; description?: string }) {
        return client.from("task_labels").insert(data).select().single();
    },

    async update(client: SupabaseClient, id: string, data: Record<string, unknown>) {
        return client.from("task_labels").update(data).eq("id", id).select().single();
    },

    async delete(client: SupabaseClient, id: string) {
        return client.from("task_labels").delete().eq("id", id);
    },

    async getAssignmentCount(client: SupabaseClient, labelId: string) {
        return client
            .from("task_label_assignments")
            .select("*", { count: "exact", head: true })
            .eq("label_id", labelId);
    },
};

// ─────────────────────────────────────────────
// Data Access Layer — Team Members
// ─────────────────────────────────────────────
export const TeamMembersDAL = {
    async list(client: SupabaseClient) {
        return client
            .from("team_members")
            .select("*")
            .eq("is_active", true)
            .order("name", { ascending: true });
    },

    async getByEmail(client: SupabaseClient, email: string) {
        return client
            .from("team_members")
            .select("id, admin_user_id")
            .eq("email", email)
            .single();
    },

    async create(client: SupabaseClient, data: Record<string, unknown>) {
        return client.from("team_members").insert(data).select().single();
    },
};

// ─────────────────────────────────────────────
// Data Access Layer — Milestones
// ─────────────────────────────────────────────
export const MilestonesDAL = {
    async list(client: SupabaseClient, filters?: { status?: string }) {
        let query = client
            .from("milestones")
            .select("*, task:tasks(id, title, status)")
            .order("created_at", { ascending: false });
        if (filters?.status) {
            query = query.eq("status", filters.status);
        }
        return query;
    },

    async getById(client: SupabaseClient, id: string) {
        return client
            .from("milestones")
            .select("*, task:tasks(id, title, status)")
            .eq("id", id)
            .single();
    },

    async getByTaskId(client: SupabaseClient, taskId: string) {
        return client
            .from("milestones")
            .select("*, task:tasks(id, title, status)")
            .eq("task_id", taskId)
            .single();
    },

    async create(client: SupabaseClient, data: Record<string, unknown>) {
        return client.from("milestones").insert(data).select("*, task:tasks(id, title, status)").single();
    },

    async update(client: SupabaseClient, id: string, data: Record<string, unknown>) {
        return client.from("milestones").update(data).eq("id", id).select("*, task:tasks(id, title, status)").single();
    },

    async delete(client: SupabaseClient, id: string) {
        return client.from("milestones").delete().eq("id", id);
    },

    // Sub-milestones
    async listSubMilestones(client: SupabaseClient, milestoneId: string) {
        return client
            .from("sub_milestones")
            .select("*, assignee:team_members(*)")
            .eq("milestone_id", milestoneId)
            .order("major_number", { ascending: true })
            .order("minor_number", { ascending: true });
    },

    async getSubMilestone(client: SupabaseClient, id: string) {
        return client.from("sub_milestones").select("*, assignee:team_members(*)").eq("id", id).single();
    },

    async createSubMilestone(client: SupabaseClient, data: Record<string, unknown>) {
        return client.from("sub_milestones").insert(data).select("*, assignee:team_members(*)").single();
    },

    async updateSubMilestone(client: SupabaseClient, id: string, data: Record<string, unknown>) {
        return client.from("sub_milestones").update(data).eq("id", id).select("*, assignee:team_members(*)").single();
    },

    async deleteSubMilestone(client: SupabaseClient, id: string) {
        return client.from("sub_milestones").delete().eq("id", id);
    },

    async getMaxSubMilestoneNumbers(client: SupabaseClient, milestoneId: string) {
        return client
            .from("sub_milestones")
            .select("major_number, minor_number")
            .eq("milestone_id", milestoneId)
            .order("major_number", { ascending: false })
            .order("minor_number", { ascending: false })
            .limit(1)
            .single();
    },
};

// ─────────────────────────────────────────────
// Data Access Layer — Notifications
// ─────────────────────────────────────────────
export const NotificationsDAL = {
    async list(client: SupabaseClient, userId: string, opts: { unreadOnly?: boolean; limit?: number; offset?: number }) {
        let query = client
            .from("notifications")
            .select("*")
            .eq("recipient_id", userId)
            .eq("is_archived", false)
            .order("created_at", { ascending: false });

        if (opts.unreadOnly) query = query.eq("is_read", false);
        if (opts.limit) query = query.limit(opts.limit);
        if (opts.offset) query = query.range(opts.offset, opts.offset + (opts.limit ?? 20) - 1);

        return query;
    },

    async markRead(client: SupabaseClient, userId: string, notificationIds: string[]) {
        return client
            .from("notifications")
            .update({ is_read: true, read_at: new Date().toISOString() })
            .eq("recipient_id", userId)
            .in("id", notificationIds);
    },

    async delete(client: SupabaseClient, id: string) {
        return client.from("notifications").delete().eq("id", id);
    },

    async archive(client: SupabaseClient, id: string) {
        return client.from("notifications").update({ is_archived: true }).eq("id", id);
    },

    async getUnreadCount(client: SupabaseClient, userId: string) {
        return client
            .from("notifications")
            .select("*", { count: "exact", head: true })
            .eq("recipient_id", userId)
            .eq("is_read", false)
            .eq("is_archived", false);
    },
};

// ─────────────────────────────────────────────
// Data Access Layer — Admin (service_role only for bootstrapping)
// ─────────────────────────────────────────────
export const AdminDAL = {
    /** Dashboard stats via RPC (user-scoped client) */
    async getDashboardStats(client: SupabaseClient) {
        return client.rpc("get_admin_dashboard_stats");
    },

    /** Activity logs with pagination */
    async getActivityLogs(client: SupabaseClient, opts: { limit: number; offset: number }) {
        return client
            .from("admin_activity_log")
            .select("*, admin_user:admin_users(id, email, full_name, avatar_url)", { count: "exact" })
            .order("created_at", { ascending: false })
            .range(opts.offset, opts.offset + opts.limit - 1);
    },

    /** Delete audit logs older than a date (via RPC) */
    async deleteAuditLogsBefore(client: SupabaseClient, before: string) {
        return client.rpc("delete_audit_logs_before", { delete_before_date: before });
    },

    /** Active sessions list */
    async getActiveSessions(client: SupabaseClient) {
        return client
            .from("admin_sessions")
            .select("*, admin_user:admin_users(id, email, full_name, avatar_url, role)")
            .eq("is_revoked", false)
            .gte("expires_at", new Date().toISOString())
            .order("last_activity_at", { ascending: false });
    },

    /** Revoke a session */
    async revokeSession(client: SupabaseClient, sessionId: string, reason: string) {
        return client
            .from("admin_sessions")
            .update({
                is_revoked: true,
                revoked_at: new Date().toISOString(),
                revoked_reason: reason,
            })
            .eq("id", sessionId);
    },

    /** Update session activity */
    async updateSessionActivity(client: SupabaseClient, adminUserId: string) {
        return client
            .from("admin_sessions")
            .update({ last_activity_at: new Date().toISOString() })
            .eq("admin_user_id", adminUserId)
            .eq("is_revoked", false)
            .gte("expires_at", new Date().toISOString());
    },

    /** Delete expired sessions */
    async deleteExpiredSessions(client: SupabaseClient) {
        return client
            .from("admin_sessions")
            .delete({ count: "exact" })
            .lt("expires_at", new Date().toISOString());
    },

    /** Log admin activity */
    async logActivity(client: SupabaseClient, data: {
        admin_user_id: string;
        action: string;
        resource_type: string;
        resource_id?: string | null;
        description?: string | null;
        changes?: Record<string, unknown>;
        ip_address: string;
        user_agent?: string | null;
        severity?: "info" | "warning" | "critical";
    }) {
        return client.from("admin_activity_log").insert({
            ...data,
            changes: data.changes ?? {},
            severity: data.severity ?? "info",
        });
    },

    // ─── Service-role only (bootstrapping) ───

    /** Create admin user (service_role required — no RLS user context) */
    async createAdminUser(data: Record<string, unknown>) {
        return supabaseAdmin.from("admin_users").insert(data).select().single();
    },

    /** Get admin user by email (service_role — used in auth flow before JWT exists) */
    async getAdminUserByEmail(email: string) {
        return supabaseAdmin
            .from("admin_users")
            .select("*")
            .eq("email", email)
            .single();
    },

    /** Get admin user by ID (service_role) */
    async getAdminUserById(id: string) {
        return supabaseAdmin
            .from("admin_users")
            .select("*")
            .eq("id", id)
            .single();
    },

    /** List all admin users for recipient dropdown */
    async listAdminUsers(client: SupabaseClient) {
        return client
            .from("admin_users")
            .select("id, email, full_name, avatar_url, role, is_active")
            .eq("is_active", true)
            .order("full_name", { ascending: true });
    },

    /** Record a login attempt (service_role — pre-authentication context) */
    async recordLoginAttempt(data: {
        email: string;
        ip_address: string;
        user_agent: string | null;
        success: boolean;
        admin_user_id?: string | null;
        attempt_type: "password" | "biometric";
        failure_reason?: string | null;
        device_info: Record<string, unknown>;
        geo_location?: Record<string, unknown>;
    }) {
        return supabaseAdmin.from("admin_login_attempts").insert({
            ...data,
            admin_user_id: data.admin_user_id ?? null,
            failure_reason: data.failure_reason ?? null,
            geo_location: data.geo_location ?? {},
        });
    },

    /** Log admin activity using service_role (pre-login context, no JWT available) */
    async logActivityServiceRole(data: {
        admin_user_id: string;
        action: string;
        resource_type: string;
        resource_id?: string | null;
        description?: string | null;
        changes?: Record<string, unknown>;
        ip_address: string;
        user_agent?: string | null;
        severity?: "info" | "warning" | "critical";
    }) {
        return supabaseAdmin.from("admin_activity_log").insert({
            ...data,
            changes: data.changes ?? {},
            severity: data.severity ?? "info",
        });
    },
};

// ─────────────────────────────────────────────
// Data Access Layer — WebAuthn
// ─────────────────────────────────────────────
export const WebAuthnDAL = {
    async getCredentials(client: SupabaseClient, adminUserId: string) {
        return client
            .from("webauthn_credentials")
            .select("*")
            .eq("user_id", adminUserId);
    },

    async getCredentialsByEmail(email: string) {
        // Needs service_role — pre-login, no JWT context
        const { data: admin } = await supabaseAdmin
            .from("admin_users")
            .select("id")
            .eq("email", email)
            .single();
        if (!admin) return { data: null, error: { message: "User not found" } };

        return supabaseAdmin
            .from("webauthn_credentials")
            .select("*")
            .eq("user_id", admin.id);
    },

    async createCredential(data: Record<string, unknown>) {
        // Uses service_role — during registration flow
        return supabaseAdmin.from("webauthn_credentials").insert(data).select().single();
    },

    async deleteCredential(client: SupabaseClient, credentialId: string, adminUserId: string) {
        return client
            .from("webauthn_credentials")
            .delete()
            .eq("credential_id", credentialId)
            .eq("user_id", adminUserId);
    },

    async updateCredentialCounter(credentialId: string, counter: number) {
        // Uses service_role — during auth verification
        return supabaseAdmin
            .from("webauthn_credentials")
            .update({ counter, last_used_at: new Date().toISOString() })
            .eq("credential_id", credentialId);
    },

    async checkEnrollment(email: string) {
        const { data: admin } = await supabaseAdmin
            .from("admin_users")
            .select("id, biometric_enabled")
            .eq("email", email)
            .single();

        if (!admin) return { enrolled: false, biometricEnabled: false };

        const { count } = await supabaseAdmin
            .from("webauthn_credentials")
            .select("*", { count: "exact", head: true })
            .eq("user_id", admin.id);

        return {
            enrolled: (count ?? 0) > 0,
            biometricEnabled: admin.biometric_enabled ?? false,
            adminUserId: admin.id,
        };
    },

    async getBiometricConfig() {
        return supabaseAdmin
            .from("biometric_config")
            .select("*")
            .limit(1)
            .single();
    },

    // ── Server-side challenge store ──

    async storeChallenge(email: string, challenge: string, type: "registration" | "authentication") {
        // Delete any existing challenges for this email+type first
        await supabaseAdmin
            .from("webauthn_challenges")
            .delete()
            .eq("email", email)
            .eq("type", type);

        // Clean up expired challenges opportunistically
        await supabaseAdmin
            .from("webauthn_challenges")
            .delete()
            .lt("expires_at", new Date().toISOString());

        return supabaseAdmin
            .from("webauthn_challenges")
            .insert({ email, challenge, type })
            .select()
            .single();
    },

    async getChallenge(email: string, type: "registration" | "authentication") {
        const { data, error } = await supabaseAdmin
            .from("webauthn_challenges")
            .select("challenge, expires_at")
            .eq("email", email)
            .eq("type", type)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

        if (error || !data) return null;

        // Check expiry
        if (new Date(data.expires_at) < new Date()) {
            // Expired — clean it up
            await supabaseAdmin
                .from("webauthn_challenges")
                .delete()
                .eq("email", email)
                .eq("type", type);
            return null;
        }

        return data.challenge as string;
    },

    async deleteChallenge(email: string, type: "registration" | "authentication") {
        return supabaseAdmin
            .from("webauthn_challenges")
            .delete()
            .eq("email", email)
            .eq("type", type);
    },
};

// ─────────────────────────────────────────────
// Data Access Layer — Push Subscriptions
// ─────────────────────────────────────────────
export const PushDAL = {
    async getSubscriptions(client: SupabaseClient, adminUserId: string) {
        return client
            .from("push_subscriptions")
            .select("*")
            .eq("admin_user_id", adminUserId);
    },

    async saveSubscription(client: SupabaseClient, data: Record<string, unknown>) {
        return client.from("push_subscriptions").upsert(data, { onConflict: "endpoint" }).select().single();
    },

    async deleteSubscription(client: SupabaseClient, subscriptionId: string, adminUserId: string) {
        return client
            .from("push_subscriptions")
            .delete()
            .eq("id", subscriptionId)
            .eq("admin_user_id", adminUserId);
    },
};

// ─────────────────────────────────────────────
// Data Access Layer — Conversations / Messages
// ─────────────────────────────────────────────
export const ConversationsDAL = {
    async getOrCreateDM(client: SupabaseClient, userId: string, recipientId: string) {
        return client.rpc("get_or_create_dm_conversation", {
            p_user_id: userId,
            p_other_user_id: recipientId,
        });
    },

    async sendMessage(client: SupabaseClient, data: {
        conversation_id: string;
        sender_id: string;
        content: string;
    }) {
        return client.from("admin_messages").insert(data).select().single();
    },
};
