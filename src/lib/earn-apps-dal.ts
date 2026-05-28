import type { SupabaseClient } from "@supabase/supabase-js";

export type EarnAppsUser = {
    id: string;
    app_id: string;
    ad_id_hash: string | null;
    ad_id_last4: string | null;
    platform: string | null;
    app_version: string | null;
    status: string;
    total_revenue_usd: string | number | null;
    points_balance: number;
    lifetime_points: number;
    withdrawn_points: number;
    security_flags: Record<string, unknown> | null;
    last_seen_at: string | null;
    created_at: string;
    updated_at: string;
    install_id_hash: string | null;
    install_id_last4: string | null;
    previous_ad_id_hash: string | null;
    previous_ad_id_last4: string | null;
};

export type EarnAppsWithdrawal = {
    id: string;
    user_id: string;
    app_id: string;
    amount_usd: string | number;
    points_spent: number;
    status: string;
    request_ip: string | null;
    user_agent: string | null;
    admin_note: string | null;
    created_at: string;
    updated_at: string;
    processed_at: string | null;
    payout_method: string | null;
    payout_account: string | null;
    user?: Pick<EarnAppsUser, "id" | "app_id" | "ad_id_last4" | "install_id_last4" | "platform" | "status"> | null;
};

const USER_SORT_FIELDS = new Set([
    "created_at",
    "updated_at",
    "last_seen_at",
    "total_revenue_usd",
    "points_balance",
    "lifetime_points",
    "withdrawn_points",
    "app_id",
    "status",
]);

const WITHDRAWAL_SORT_FIELDS = new Set([
    "created_at",
    "updated_at",
    "processed_at",
    "amount_usd",
    "points_spent",
    "status",
    "app_id",
]);

function safeSortBy(value: string | undefined, allowed: Set<string>, fallback: string) {
    return value && allowed.has(value) ? value : fallback;
}

function isAsc(value: string | undefined) {
    return value?.toLowerCase() === "asc";
}

export const EarnAppsUsersDAL = {
    async list(
        client: SupabaseClient,
        params: {
            limit?: number;
            offset?: number;
            search?: string;
            appId?: string;
            status?: string;
            sortBy?: string;
            sortOrder?: string;
        },
    ) {
        const sortBy = safeSortBy(params.sortBy, USER_SORT_FIELDS, "created_at");
        let query = client
            .from("earn_apps_users")
            .select("*", { count: "exact" })
            .order(sortBy, { ascending: isAsc(params.sortOrder), nullsFirst: false })
            .range(
                params.offset ?? 0,
                (params.offset ?? 0) + (params.limit ?? 50) - 1,
            );

        if (params.appId && params.appId !== "all") query = query.eq("app_id", params.appId);
        if (params.status && params.status !== "all") query = query.eq("status", params.status);
        if (params.search) {
            query = query.or(
                `app_id.ilike.%${params.search}%,ad_id_last4.ilike.%${params.search}%,install_id_last4.ilike.%${params.search}%,previous_ad_id_last4.ilike.%${params.search}%`,
            );
        }

        return query;
    },

    async stats(client: SupabaseClient) {
        const { data, error } = await client
            .from("earn_apps_users")
            .select("app_id,status,total_revenue_usd,points_balance,lifetime_points,withdrawn_points,last_seen_at");

        if (error) return { data: null, error };

        const rows = (data ?? []) as EarnAppsUser[];
        const now = Date.now();
        const dayMs = 24 * 60 * 60 * 1000;
        const activeLast24h = rows.filter((row) => row.last_seen_at && now - new Date(row.last_seen_at).getTime() <= dayMs).length;
        const byStatus = rows.reduce<Record<string, number>>((acc, row) => {
            acc[row.status ?? "unknown"] = (acc[row.status ?? "unknown"] ?? 0) + 1;
            return acc;
        }, {});
        const byApp = rows.reduce<Record<string, number>>((acc, row) => {
            acc[row.app_id ?? "unknown"] = (acc[row.app_id ?? "unknown"] ?? 0) + 1;
            return acc;
        }, {});

        return {
            data: {
                totalUsers: rows.length,
                activeLast24h,
                totalRevenueUsd: rows.reduce((sum, row) => sum + Number(row.total_revenue_usd ?? 0), 0),
                totalPointsBalance: rows.reduce((sum, row) => sum + Number(row.points_balance ?? 0), 0),
                lifetimePoints: rows.reduce((sum, row) => sum + Number(row.lifetime_points ?? 0), 0),
                withdrawnPoints: rows.reduce((sum, row) => sum + Number(row.withdrawn_points ?? 0), 0),
                byStatus,
                byApp,
            },
            error: null,
        };
    },
};

export const EarnAppsWithdrawalsDAL = {
    async list(
        client: SupabaseClient,
        params: {
            limit?: number;
            offset?: number;
            search?: string;
            appId?: string;
            status?: string;
            method?: string;
            sortBy?: string;
            sortOrder?: string;
        },
    ) {
        const sortBy = safeSortBy(params.sortBy, WITHDRAWAL_SORT_FIELDS, "created_at");
        let query = client
            .from("earn_apps_withdrawal_requests")
            .select(
                "*, user:earn_apps_users(id, app_id, ad_id_last4, install_id_last4, platform, status)",
                { count: "exact" },
            )
            .order(sortBy, { ascending: isAsc(params.sortOrder), nullsFirst: false })
            .range(
                params.offset ?? 0,
                (params.offset ?? 0) + (params.limit ?? 50) - 1,
            );

        if (params.appId && params.appId !== "all") query = query.eq("app_id", params.appId);
        if (params.status && params.status !== "all") query = query.eq("status", params.status);
        if (params.method && params.method !== "all") query = query.eq("payout_method", params.method);
        if (params.search) {
            const filters = [
                `payout_account.ilike.%${params.search}%`,
                `payout_method.ilike.%${params.search}%`,
                `app_id.ilike.%${params.search}%`,
            ];
            if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(params.search)) {
                filters.unshift(`id.eq.${params.search}`);
            }
            query = query.or(filters.join(","));
        }

        return query;
    },

    async stats(client: SupabaseClient) {
        const { data, error } = await client
            .from("earn_apps_withdrawal_requests")
            .select("app_id,status,payout_method,amount_usd,points_spent,created_at,processed_at");

        if (error) return { data: null, error };

        const rows = (data ?? []) as EarnAppsWithdrawal[];
        const now = new Date();
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);
        const month = new Date(now.getFullYear(), now.getMonth(), 1);
        const pendingStatuses = new Set(["pending", "processing", "approved"]);
        const paidStatuses = new Set(["paid", "completed"]);

        const totals = rows.reduce(
            (acc, row) => {
                const usd = Number(row.amount_usd ?? 0);
                const points = Number(row.points_spent ?? 0);
                acc.totalUsd += usd;
                acc.totalPoints += points;
                if (pendingStatuses.has(row.status)) {
                    acc.pendingCount += 1;
                    acc.pendingUsd += usd;
                    acc.pendingPoints += points;
                }
                if (paidStatuses.has(row.status)) {
                    acc.paidCount += 1;
                    acc.paidUsd += usd;
                    acc.paidPoints += points;
                }
                if (row.status === "denied" || row.status === "rejected") acc.deniedCount += 1;
                const created = new Date(row.created_at);
                if (created >= today) acc.todayCount += 1;
                if (created >= month) acc.monthCount += 1;
                acc.byStatus[row.status ?? "unknown"] = (acc.byStatus[row.status ?? "unknown"] ?? 0) + 1;
                acc.byMethod[row.payout_method ?? "unknown"] = (acc.byMethod[row.payout_method ?? "unknown"] ?? 0) + 1;
                acc.byApp[row.app_id ?? "unknown"] = (acc.byApp[row.app_id ?? "unknown"] ?? 0) + 1;
                return acc;
            },
            {
                totalUsd: 0,
                totalPoints: 0,
                pendingCount: 0,
                pendingUsd: 0,
                pendingPoints: 0,
                paidCount: 0,
                paidUsd: 0,
                paidPoints: 0,
                deniedCount: 0,
                todayCount: 0,
                monthCount: 0,
                byStatus: {} as Record<string, number>,
                byMethod: {} as Record<string, number>,
                byApp: {} as Record<string, number>,
            },
        );

        return { data: { totalRequests: rows.length, ...totals }, error: null };
    },

    async updateStatus(
        client: SupabaseClient,
        withdrawalId: string,
        status: string,
        adminNote?: string,
    ) {
        const processedAt = ["paid", "denied", "rejected", "completed"].includes(status)
            ? new Date().toISOString()
            : null;

        return client
            .from("earn_apps_withdrawal_requests")
            .update({
                status,
                admin_note: adminNote ?? null,
                processed_at: processedAt,
                updated_at: new Date().toISOString(),
            })
            .eq("id", withdrawalId)
            .select()
            .single();
    },
};
