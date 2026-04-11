/**
 * KPEI (KPE Infrastructure) Data Access Layer
 *
 * Server-side functions for the new KeepPlayEngineInfrastructure project.
 * Tables: users, wallets, withdrawal_requests, daily_challenge_progress
 */

import type { SupabaseClient } from "@supabase/supabase-js";

// ─────────────────────────────────────────────
// Withdrawals DAL
// ─────────────────────────────────────────────

export const KpeiWithdrawalsDAL = {
    /** List withdrawal requests with filtering, search, method filter, and pagination */
    async list(
        client: SupabaseClient,
        params: {
            limit?: number;
            offset?: number;
            status?: string;
            method?: string;
            userId?: string;
            search?: string;
        },
    ) {
        let query = client
            .from("withdrawal_requests")
            .select(
                "*, user:users!withdrawal_requests_user_id_fkey(id, display_name, current_ad_id, fcm_token, country_code, city, created_at)",
                { count: "exact" },
            )
            .order("created_at", { ascending: false })
            .range(
                params.offset ?? 0,
                (params.offset ?? 0) + (params.limit ?? 50) - 1,
            );

        if (params.status && params.status !== "all") {
            query = query.eq("status", params.status);
        }
        if (params.method && params.method !== "all") {
            query = query.eq("method", params.method);
        }
        if (params.userId) {
            query = query.eq("user_id", params.userId);
        }
        if (params.search) {
            query = query.or(
                `payout_address.ilike.%${params.search}%,id.eq.${params.search}`,
            );
        }

        return query;
    },

    /** Get withdrawal dashboard stats via RPC */
    async getStats(client: SupabaseClient) {
        return client.rpc("admin_withdrawal_stats");
    },

    /** Update withdrawal status via RPC (approve/deny with optional refund) */
    async updateStatus(
        client: SupabaseClient,
        withdrawalId: string,
        newStatus: string,
        denialReason?: string,
        refund?: boolean,
    ) {
        return client.rpc("admin_update_withdrawal_status", {
            p_withdrawal_id: withdrawalId,
            p_new_status: newStatus,
            p_denial_reason: denialReason ?? null,
            p_refund: refund ?? true,
        });
    },
};

// ─────────────────────────────────────────────
// Users DAL
// ─────────────────────────────────────────────

export const KpeiUsersDAL = {
    /** List users with pagination, search, sorting */
    async list(
        client: SupabaseClient,
        params: {
            limit?: number;
            offset?: number;
            search?: string;
            sortBy?: string;
            sortOrder?: string;
        },
    ) {
        return client.rpc("admin_list_users", {
            p_limit: params.limit ?? 50,
            p_offset: params.offset ?? 0,
            p_search: params.search ?? null,
            p_sort_by: params.sortBy ?? "created_at",
            p_sort_order: params.sortOrder ?? "desc",
        });
    },

    /** Get full user detail including wallet, withdrawals, challenges */
    async getDetail(client: SupabaseClient, userId: string) {
        return client.rpc("admin_get_user_detail", {
            p_user_id: userId,
        });
    },

    /** Update user fields */
    async update(
        client: SupabaseClient,
        userId: string,
        data: { display_name?: string; country_code?: string; city?: string },
    ) {
        return client.rpc("admin_update_user", {
            p_user_id: userId,
            p_display_name: data.display_name ?? null,
            p_country_code: data.country_code ?? null,
            p_city: data.city ?? null,
        });
    },

    /** Delete user and all related data */
    async delete(client: SupabaseClient, userId: string) {
        return client.rpc("admin_delete_user", {
            p_user_id: userId,
        });
    },

    /** Update wallet balance */
    async updateBalance(client: SupabaseClient, userId: string, newBalance: number) {
        return client.rpc("admin_update_wallet_balance", {
            p_user_id: userId,
            p_new_balance: newBalance,
        });
    },
};

// ─────────────────────────────────────────────
// Economy / Ad-Revenue DAL
// ─────────────────────────────────────────────

export const KpeiEconomyDAL = {
    /** Aggregate wallet stats: total coins in circulation, user count */
    async getWalletStats(client: SupabaseClient) {
        const { data, error } = await client
            .from("wallets")
            .select("balance");
        if (error) return { data: null, error };
        const balances = (data ?? []).map((w: { balance: number }) => w.balance);
        const totalCoins = balances.reduce((s: number, b: number) => s + b, 0);
        const userCount = balances.length;
        const avgBalance = userCount > 0 ? totalCoins / userCount : 0;
        return { data: { totalCoins, userCount, avgBalance }, error: null };
    },

    /** Aggregate challenge stats: total coins earned, total bonus, total claimed */
    async getChallengeStats(client: SupabaseClient) {
        const { data, error } = await client
            .from("daily_challenge_progress")
            .select("coins_earned, bonus_coins, claimed");
        if (error) return { data: null, error };
        const rows = data ?? [];
        const totalCoinsEarned = rows.reduce((s: number, r: { coins_earned: number }) => s + r.coins_earned, 0);
        const totalBonusCoins = rows.reduce((s: number, r: { bonus_coins: number }) => s + r.bonus_coins, 0);
        const totalChallenges = rows.length;
        const claimedCount = rows.filter((r: { claimed: boolean }) => r.claimed).length;
        return { data: { totalCoinsEarned, totalBonusCoins, totalChallenges, claimedCount }, error: null };
    },

    /** Aggregate withdrawal stats: total withdrawn coins, total USD, count */
    async getWithdrawalEconomyStats(client: SupabaseClient) {
        const { data, error } = await client
            .from("withdrawal_requests")
            .select("amount_coins, amount_usd, status");
        if (error) return { data: null, error };
        const rows = data ?? [];
        const paid = rows.filter((r: { status: string }) => r.status === "paid");
        const pending = rows.filter((r: { status: string }) => r.status === "pending" || r.status === "processing");
        const totalPaidCoins = paid.reduce((s: number, r: { amount_coins: number }) => s + r.amount_coins, 0);
        const totalPaidUsd = paid.reduce((s: number, r: { amount_usd: string }) => s + parseFloat(r.amount_usd), 0);
        const totalPendingCoins = pending.reduce((s: number, r: { amount_coins: number }) => s + r.amount_coins, 0);
        return {
            data: {
                totalPaidCoins,
                totalPaidUsd,
                paidCount: paid.length,
                totalPendingCoins,
                pendingCount: pending.length,
                totalRequests: rows.length,
            },
            error: null,
        };
    },
};
