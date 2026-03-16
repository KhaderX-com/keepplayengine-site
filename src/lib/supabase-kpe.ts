/**
 * KeepPlay Engine (KPE) Supabase Client
 *
 * Server-side only client for the KeepPlay Engine backend/database.
 * Project ref: dcffftbrcxnwarxpupdg
 *
 * This is SEPARATE from the main admin Supabase client (fzaxodiqzeatvwpvfbbv)
 * which handles the website, admin auth, roles, sessions, etc.
 *
 * This client connects to the KPE database where the Loyalty Program,
 * games, players, wallets, withdrawals, ad events, etc. live.
 *
 * SECURITY:
 * - Server-side ONLY (throws if accessed from browser)
 * - Uses service_role key (bypasses RLS — admin has full read/write)
 * - All access is audited via log_admin_audit RPC
 * - Rate limited via check_admin_rate_limit RPC
 * - Never exposed to the client bundle
 */

import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { KpeDatabase } from "@/generated/kpe-database.types";

// Re-export generated types for convenience
export type { KpeDatabase, KpeTables, KpeTablesInsert, KpeTablesUpdate, KpeFunctionArgs, KpeFunctionReturns } from "@/generated/kpe-database.types";
import type { KpeTables } from "@/generated/kpe-database.types";

// ─────────────────────────────────────────────
// Environment validation (server startup)
// ─────────────────────────────────────────────
if (typeof window === "undefined") {
    const KPE_REQUIRED = [
        "KPE_SUPABASE_URL",
        "KPE_SUPABASE_SERVICE_ROLE_KEY",
    ] as const;
    for (const key of KPE_REQUIRED) {
        if (!process.env[key]) {
            throw new Error(
                `[SECURITY] Missing required KPE environment variable: ${key}. ` +
                `Server cannot start safely. The KeepPlay Engine backend connection requires this.`
            );
        }
    }
}

// ─────────────────────────────────────────────
// Singleton client
// ─────────────────────────────────────────────
let _kpeAdmin: SupabaseClient<KpeDatabase> | null = null;

function getKpeAdmin(): SupabaseClient<KpeDatabase> {
    if (typeof window !== "undefined") {
        throw new Error(
            "kpeAdmin can only be used on the server-side. " +
            "This client uses the KPE service_role key and must never be exposed to the browser."
        );
    }

    const url = process.env.KPE_SUPABASE_URL;
    const serviceKey = process.env.KPE_SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
        throw new Error("Missing KPE_SUPABASE_URL or KPE_SUPABASE_SERVICE_ROLE_KEY");
    }

    if (!_kpeAdmin) {
        _kpeAdmin = createClient<KpeDatabase>(url, serviceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
            db: {
                schema: "public",
            },
            global: {
                headers: {
                    "x-connection-encrypted": "true",
                    "x-client-info": "keepplay-admin-panel",
                },
            },
        });
    }

    return _kpeAdmin;
}

// Export as a proxy (same pattern as the main admin client)
export const kpeAdmin = new Proxy({} as SupabaseClient<KpeDatabase>, {
    get(_target, prop) {
        const admin = getKpeAdmin();
        return admin[prop as keyof SupabaseClient<KpeDatabase>];
    },
});

// ─────────────────────────────────────────────
// Admin RPC Response Types
//
// These describe the JSON shapes returned by our custom
// admin_* RPC functions. They are NOT auto-generated.
// ─────────────────────────────────────────────
export interface KpeDashboardStats {
    success: boolean;
    total_users: number;
    active_users: number;
    total_wallets: number;
    total_balance: number;
    total_withdrawals: number;
    pending_withdrawals: number;
    total_ad_events: number;
    today_ad_events: number;
    today_registrations: number;
}

// ─────────────────────────────────────────────
// Paginated User List (from RPC)
// ─────────────────────────────────────────────
export interface KpeUserListItem {
    id: string;
    ad_id: string;
    platform: string;
    status: string;
    has_fcm_token: boolean;
    created_at: string;
    updated_at: string;
    wallet_balance: number;
    display_name: string;
    total_withdrawals: number;
    total_ad_events: number;
}

export interface KpeUserListResponse {
    success: boolean;
    users: KpeUserListItem[];
    total: number;
    limit: number;
    offset: number;
}

// ─────────────────────────────────────────────
// User Detail (from RPC)
// ─────────────────────────────────────────────
export interface KpeUserDetail {
    success: boolean;
    user: KpeTables<"users">;
    wallet: KpeTables<"wallets"> | null;
    profile: KpeTables<"user_profile"> | null;
    recent_transactions: KpeTables<"wallet_transactions">[];
    recent_withdrawals: KpeTables<"withdrawal_requests">[];
    game_earnings: KpeTables<"user_game_earnings">[];
}
