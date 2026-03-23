/**
 * KeepPlay Engine Data Access Layer (DAL)
 *
 * Server-side only functions that query the KPE database
 * via the service_role Supabase client.
 *
 * All functions accept a SupabaseClient so they can be used
 * with the kpeAdmin client from the gateway context.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
    KpeDashboardStats,
    KpeUserListResponse,
    KpeUserDetail,
} from "@/lib/supabase-kpe";

// ─────────────────────────────────────────────
// KPE DAL — Users
// ─────────────────────────────────────────────

export const KpeUsersDAL = {
    /**
     * List users with pagination, filtering, and search.
     * Uses the admin_list_users RPC for efficient querying.
     */
    async list(
        client: SupabaseClient,
        params: {
            limit?: number;
            offset?: number;
            status?: string;
            search?: string;
            sortBy?: string;
            sortOrder?: string;
        },
    ): Promise<{ data: KpeUserListResponse | null; error: Error | null }> {
        const { data, error } = await client.rpc("admin_list_users", {
            p_limit: params.limit ?? 50,
            p_offset: params.offset ?? 0,
            p_status: params.status ?? null,
            p_search: params.search ?? null,
            p_sort_by: params.sortBy ?? "created_at",
            p_sort_order: params.sortOrder ?? "desc",
        });

        if (error) return { data: null, error };
        return { data: data as KpeUserListResponse, error: null };
    },

    /**
     * Get detailed user info including wallet, profile, transactions, etc.
     */
    async getDetail(
        client: SupabaseClient,
        userId: string,
    ): Promise<{ data: KpeUserDetail | null; error: Error | null }> {
        const { data, error } = await client.rpc("admin_get_user", {
            p_user_id: userId,
        });

        if (error) return { data: null, error };
        return { data: data as KpeUserDetail, error: null };
    },
};

// ─────────────────────────────────────────────
// KPE DAL — Dashboard / Stats
// ─────────────────────────────────────────────

export const KpeStatsDAL = {
    /**
     * Get high-level dashboard stats for the KPE overview.
     */
    async getDashboardStats(
        client: SupabaseClient,
    ): Promise<{ data: KpeDashboardStats | null; error: Error | null }> {
        const { data, error } = await client.rpc("admin_get_dashboard_stats");

        if (error) return { data: null, error };
        return { data: data as KpeDashboardStats, error: null };
    },
};

// ─────────────────────────────────────────────
// KPE DAL — Withdrawals
// ─────────────────────────────────────────────

export const KpeWithdrawalsDAL = {
    /**
     * List withdrawal requests with filtering.
     */
    async list(
        client: SupabaseClient,
        params: {
            limit?: number;
            offset?: number;
            status?: string;
            userId?: string;
            search?: string;
        },
    ) {
        let query = client
            .from("withdrawal_requests")
            .select(
                "*, user:users(id, ad_id, platform, status, user_profile(display_name)), method:withdrawal_methods(display_name, method_key, logo_url)",
                { count: "exact" },
            )
            .order("created_at", { ascending: false })
            .range(
                params.offset ?? 0,
                (params.offset ?? 0) + (params.limit ?? 50) - 1,
            );

        if (params.status) {
            query = query.eq("status", params.status);
        }
        if (params.userId) {
            query = query.eq("user_id", params.userId);
        }
        if (params.search) {
            query = query.or(
                `destination_plain.ilike.%${params.search}%,destination_masked.ilike.%${params.search}%`,
            );
        }

        return query;
    },

    /**
     * Get withdrawal dashboard statistics.
     */
    async getStats(client: SupabaseClient) {
        return client.rpc("admin_withdrawal_stats");
    },

    /**
     * Update a withdrawal request status (approve/reject).
     */
    async updateStatus(
        client: SupabaseClient,
        withdrawalId: string,
        newStatus: string,
        adminNotes?: string,
        refund?: boolean,
    ) {
        return client.rpc("admin_update_withdrawal_status", {
            p_withdrawal_id: withdrawalId,
            p_new_status: newStatus,
            p_admin_notes: adminNotes ?? null,
            p_refund: refund ?? true,
        });
    },
};

// ─────────────────────────────────────────────
// KPE DAL — App Keys
// ─────────────────────────────────────────────

export const KpeAppKeysDAL = {
    async list(client: SupabaseClient) {
        return client
            .from("app_keys")
            .select("id, app_name, app_type, is_active, created_at")
            .order("created_at", { ascending: false });
    },

    async create(
        client: SupabaseClient,
        appName: string,
        appType: string,
        appKeyHash: string,
    ) {
        return client.rpc("admin_create_app_key", {
            p_app_name: appName,
            p_app_type: appType,
            p_app_key_hash: appKeyHash,
        });
    },

    async toggle(client: SupabaseClient, keyId: string, isActive: boolean) {
        return client.rpc("admin_toggle_app_key", {
            p_key_id: keyId,
            p_is_active: isActive,
        });
    },

    async delete(client: SupabaseClient, keyId: string) {
        return client.rpc("admin_delete_app_key", {
            p_key_id: keyId,
        });
    },
};

// ─────────────────────────────────────────────
// KPE DAL — Ad Revenue Analytics
// ─────────────────────────────────────────────

export const KpeAdRevenueDAL = {
    async summary(client: SupabaseClient, from?: string, to?: string) {
        return client.rpc("admin_ad_revenue_summary", {
            p_from: from ?? null,
            p_to: to ?? null,
        });
    },

    async daily(client: SupabaseClient, from?: string, to?: string) {
        return client.rpc("admin_ad_revenue_daily", {
            p_from: from ?? null,
            p_to: to ?? null,
        });
    },

    async byType(client: SupabaseClient, from?: string, to?: string) {
        return client.rpc("admin_ad_revenue_by_type", {
            p_from: from ?? null,
            p_to: to ?? null,
        });
    },

    async byApp(client: SupabaseClient, from?: string, to?: string) {
        return client.rpc("admin_ad_revenue_by_app", {
            p_from: from ?? null,
            p_to: to ?? null,
        });
    },

    async typePerApp(client: SupabaseClient, from?: string, to?: string) {
        return client.rpc("admin_ad_revenue_type_per_app", {
            p_from: from ?? null,
            p_to: to ?? null,
        });
    },

    async chart(client: SupabaseClient, from?: string, to?: string) {
        return client.rpc("admin_ad_revenue_chart", {
            p_from: from ?? null,
            p_to: to ?? null,
        });
    },
};

// ─────────────────────────────────────────────
// KPE DAL — Config Tables (Loyalty App management)
// ─────────────────────────────────────────────

/** Strict whitelist of config tables admins may read/write */
const CONFIG_TABLES = [
    "loyalty_app_config",
    "loyalty_daily_challenges_config",
    "loyalty_games_config",
    "notification_config",
    "wallet_config",
    "withdrawal_config",
    "withdrawal_methods",
] as const;

export type ConfigTableName = (typeof CONFIG_TABLES)[number];

export function isValidConfigTable(name: string): name is ConfigTableName {
    return (CONFIG_TABLES as readonly string[]).includes(name);
}

/** Primary-key column per table */
const CONFIG_PK: Record<ConfigTableName, string> = {
    loyalty_app_config: "config_key",
    loyalty_daily_challenges_config: "id",
    loyalty_games_config: "id",
    notification_config: "id",
    wallet_config: "id",
    withdrawal_config: "id",
    withdrawal_methods: "id",
};

export function getConfigPk(table: ConfigTableName): string {
    return CONFIG_PK[table];
}

export const KpeConfigDAL = {
    /** List all rows for a config table. */
    async list(client: SupabaseClient, table: ConfigTableName) {
        return client
            .from(table)
            .select("*")
            .order(
                table === "loyalty_app_config" ? "category" : "updated_at",
                { ascending: table === "loyalty_app_config" },
            );
    },

    /** Update a single row by its primary key. */
    async update(
        client: SupabaseClient,
        table: ConfigTableName,
        pkValue: string,
        data: Record<string, unknown>,
    ) {
        const pk = CONFIG_PK[table];
        return client.from(table).update(data).eq(pk, pkValue).select().single();
    },
};

// ─────────────────────────────────────────────
// KPE DAL — Request Logs (API traffic analytics)
// ─────────────────────────────────────────────

export const KpeRequestLogsDAL = {
    async list(
        client: SupabaseClient,
        params: {
            limit?: number;
            offset?: number;
            endpoint?: string;
            statusCode?: number;
        },
    ) {
        let query = client
            .from("request_logs")
            .select("*, app:app_keys(app_name, app_type)", { count: "exact" })
            .order("created_at", { ascending: false })
            .range(
                params.offset ?? 0,
                (params.offset ?? 0) + (params.limit ?? 50) - 1,
            );

        if (params.endpoint) {
            query = query.eq("endpoint", params.endpoint);
        }
        if (params.statusCode) {
            query = query.eq("status_code", params.statusCode);
        }

        return query;
    },
};

// ─────────────────────────────────────────────
// KPE DAL — Admin Audit Log (on KPE side)
// ─────────────────────────────────────────────

export const KpeAdminAuditDAL = {
    async list(
        client: SupabaseClient,
        params: {
            limit?: number;
            offset?: number;
            adminUserId?: string;
            severity?: string;
            resourceType?: string;
        },
    ) {
        let query = client
            .from("admin_audit_log")
            .select("*", { count: "exact" })
            .order("created_at", { ascending: false })
            .range(
                params.offset ?? 0,
                (params.offset ?? 0) + (params.limit ?? 50) - 1,
            );

        if (params.adminUserId) {
            query = query.eq("admin_user_id", params.adminUserId);
        }
        if (params.severity) {
            query = query.eq("severity", params.severity);
        }
        if (params.resourceType) {
            query = query.eq("resource_type", params.resourceType);
        }

        return query;
    },
};
