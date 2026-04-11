/**
 * KPE Infrastructure (KPEI) Supabase Client
 *
 * Server-side only client for the NEW KeepPlayEngineInfrastructure project.
 * Project ref: aybbhbblnydbyttrmmgj
 *
 * Tables: users, wallets, withdrawal_requests, daily_challenge_progress
 *
 * SECURITY:
 * - Server-side ONLY (throws if accessed from browser)
 * - Uses service_role key (bypasses RLS)
 * - Never exposed to the client bundle
 */

import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

// ─────────────────────────────────────────────
// Singleton client
// ─────────────────────────────────────────────
let _kpeiAdmin: SupabaseClient | null = null;

function getKpeiAdmin(): SupabaseClient {
    if (typeof window !== "undefined") {
        throw new Error(
            "kpeiAdmin can only be used on the server-side. " +
            "This client uses the KPEI service_role key and must never be exposed to the browser."
        );
    }

    const url = process.env.KPEI_SUPABASE_URL;
    const serviceKey = process.env.KPEI_SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
        throw new Error(
            "Missing KPEI_SUPABASE_URL or KPEI_SUPABASE_SERVICE_ROLE_KEY. " +
            "Get the service_role key from: Supabase Dashboard > Project Settings > API > service_role key"
        );
    }

    if (!_kpeiAdmin) {
        _kpeiAdmin = createClient(url, serviceKey, {
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
                    "x-client-info": "keepplay-admin-kpei",
                },
            },
        });
    }

    return _kpeiAdmin;
}

// Export as a proxy (same pattern as other clients)
export const kpeiAdmin = new Proxy({} as SupabaseClient, {
    get(_target, prop) {
        const admin = getKpeiAdmin();
        return admin[prop as keyof SupabaseClient];
    },
});
