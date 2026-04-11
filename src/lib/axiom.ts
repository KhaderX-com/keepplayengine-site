/**
 * Axiom API Client — Server-side only
 *
 * Queries the two KeepPlay datasets:
 *   - keepplay-logs: All server-side events (16 types)
 *   - game-side-reports: Game SDK ad reports (write-only from SDK, read here)
 *
 * Uses APL (Axiom Processing Language) for queries.
 * Token is stored in AXIOM_API_TOKEN env var — never exposed to the client.
 */

const AXIOM_API_URL = "https://api.axiom.co/v1/datasets/_apl";
const AXIOM_DATASETS_URL = "https://api.axiom.co/v1/datasets";

const VALID_DATASETS = ["keepplay-logs", "game-side-reports"] as const;
export type AxiomDataset = (typeof VALID_DATASETS)[number];

export function isValidDataset(name: string): name is AxiomDataset {
    return (VALID_DATASETS as readonly string[]).includes(name);
}

function getAxiomToken(): string {
    const token = process.env.AXIOM_API_TOKEN;
    if (!token) {
        throw new Error("AXIOM_API_TOKEN environment variable is not set");
    }
    return token;
}

export type AxiomQueryResult = {
    tables?: Array<{
        name: string;
        fields: Array<{ name: string; type: string }>;
        columns: Array<Array<unknown>>;
    }>;
    // Legacy format
    matches?: Array<Record<string, unknown>>;
    buckets?: {
        totals?: Array<Record<string, unknown>>;
        series?: Array<Record<string, unknown>>;
    };
    status?: {
        elapsedTime?: number;
        rowsExamined?: number;
        rowsMatched?: number;
    };
};

export async function queryAxiom(
    apl: string,
    startTime?: string,
    endTime?: string,
): Promise<AxiomQueryResult> {
    const token = getAxiomToken();

    const body: Record<string, unknown> = { apl };
    if (startTime) body.startTime = startTime;
    if (endTime) body.endTime = endTime;

    const res = await fetch(`${AXIOM_API_URL}?format=tabular`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        cache: "no-store",
    });

    if (!res.ok) {
        const text = await res.text();
        // If the error is about missing fields/invalid fields, return empty result
        // This happens when no events with those fields have been ingested yet.
        // Queries will auto-resolve as data flows in.
        if (res.status === 400 && (text.includes("invalid field") || text.includes("not found"))) {
            return { tables: [], status: { elapsedTime: 0, rowsExamined: 0, rowsMatched: 0 } };
        }
        throw new Error(`Axiom query failed (${res.status}): ${text}`);
    }

    return res.json();
}

// ─────────────────────────────────────────────
// Pre-built queries for the Overview dashboard
// ─────────────────────────────────────────────

/** Total event count by type in the last 24h */
export async function getEventsByType(startTime: string, endTime: string) {
    return queryAxiom(
        `['keepplay-logs']
        | summarize count = count() by type
        | order by count desc`,
        startTime,
        endTime,
    );
}

/** Total sessions (DAU proxy) in the last 24h */
export async function getSessionCount(startTime: string, endTime: string) {
    return queryAxiom(
        `['keepplay-logs']
        | where type == "session_start"
        | summarize sessions = count(), unique_users = dcount(user_id)`,
        startTime,
        endTime,
    );
}

/** Ad events summary — total events, total revenue, total coins */
export async function getAdEventsSummary(startTime: string, endTime: string) {
    return queryAxiom(
        `['keepplay-logs']
        | where type == "ad_event"
        | summarize
            total_events = count(),
            total_revenue = sum(toreal(revenue)),
            total_coins = sum(tolong(coins_earned)),
            avg_revenue = avg(toreal(revenue))`,
        startTime,
        endTime,
    );
}

/** Errors and security events */
export async function getErrorsSummary(startTime: string, endTime: string) {
    return queryAxiom(
        `['keepplay-logs']
        | where type startswith "error" or type startswith "security_"
        | summarize count = count() by type
        | order by count desc`,
        startTime,
        endTime,
    );
}

/** Events over time (hourly buckets) */
export async function getEventsOverTime(startTime: string, endTime: string) {
    return queryAxiom(
        `['keepplay-logs']
        | summarize count = count() by bin(_time, 1h)
        | order by _time asc`,
        startTime,
        endTime,
    );
}

/** Top countries from session_start events */
export async function getTopCountries(startTime: string, endTime: string) {
    return queryAxiom(
        `['keepplay-logs']
        | where type == "session_start"
        | summarize sessions = count() by country
        | order by sessions desc
        | take 10`,
        startTime,
        endTime,
    );
}

/** Game-side reports summary (from the second dataset) */
export async function getGameSideReportsSummary(startTime: string, endTime: string) {
    return queryAxiom(
        `['game-side-reports']
        | summarize
            total_reports = count(),
            total_revenue = sum(toreal(revenue))
        by game_id
        | order by total_reports desc`,
        startTime,
        endTime,
    );
}

/** Recent events feed (last 50) */
export async function getRecentEvents(startTime: string, endTime: string) {
    return queryAxiom(
        `['keepplay-logs']
        | order by _time desc
        | take 50
        | project _time, type, severity, user_id`,
        startTime,
        endTime,
    );
}

// ─────────────────────────────────────────────
// Anti-Fraud: Cross-layer ad-revenue comparison
// ─────────────────────────────────────────────

/**
 * Server-side ad revenue per ad_id (keepplay-logs)
 * Groups by ad_id, summing revenue and counting events.
 */
export async function getFraudServerSideRevenue(startTime: string, endTime: string) {
    return queryAxiom(
        `['keepplay-logs']
        | where type == "ad_event"
        | summarize
            server_events = count(),
            server_revenue = sum(toreal(revenue)),
            server_coins = sum(tolong(coins_earned))
        by ad_id
        | order by server_revenue desc`,
        startTime,
        endTime,
    );
}

/**
 * Game-side ad revenue per ad_id (game-side-reports)
 * Groups by ad_id, summing revenue_usd and counting reports.
 */
export async function getFraudGameSideRevenue(startTime: string, endTime: string) {
    return queryAxiom(
        `['game-side-reports']
        | summarize
            game_events = count(),
            game_revenue = sum(toreal(revenue_usd))
        by ad_id
        | order by game_revenue desc`,
        startTime,
        endTime,
    );
}

/**
 * Integrity check — events with integrity issues from keepplay-logs.
 * Flags events where has_integrity is false or integrity_verified is false.
 */
export async function getFraudIntegrityFailures(startTime: string, endTime: string) {
    return queryAxiom(
        `['keepplay-logs']
        | where type == "ad_event"
        | where has_integrity == false or integrity_verified == false
        | summarize
            failed_events = count(),
            total_revenue = sum(toreal(revenue))
        by ad_id, integrity_verdict
        | order by failed_events desc`,
        startTime,
        endTime,
    );
}

/**
 * Suspicious frequency — ad_ids that fire way too many ad events per hour.
 * More than 20 events/hour is suspicious for a single user.
 */
export async function getFraudHighFrequency(startTime: string, endTime: string) {
    return queryAxiom(
        `['keepplay-logs']
        | where type == "ad_event"
        | summarize events_per_hour = count() by ad_id, bin(_time, 1h)
        | where events_per_hour > 120
        | summarize
            suspicious_hours = count(),
            max_events_in_hour = max(events_per_hour),
            avg_events_per_hour = avg(events_per_hour)
        by ad_id
        | order by max_events_in_hour desc`,
        startTime,
        endTime,
    );
}

/**
 * Revenue mismatch — compare server vs game totals aggregated.
 * Returns global totals from both datasets for the period.
 */
export async function getFraudRevenueTotals(startTime: string, endTime: string) {
    return queryAxiom(
        `['keepplay-logs']
        | where type == "ad_event"
        | summarize
            server_total_events = count(),
            server_total_revenue = sum(toreal(revenue))`,
        startTime,
        endTime,
    );
}

export async function getFraudGameRevenueTotals(startTime: string, endTime: string) {
    return queryAxiom(
        `['game-side-reports']
        | summarize
            game_total_events = count(),
            game_total_revenue = sum(toreal(revenue_usd))`,
        startTime,
        endTime,
    );
}

// ─────────────────────────────────────────────
// Nonce-based event matching queries
// ─────────────────────────────────────────────

/**
 * Server-side nonces with per-event details (keepplay-logs).
 * Returns nonce, ad_id, revenue, ad_type, game_id, timestamp.
 */
export async function getFraudServerNonces(startTime: string, endTime: string) {
    return queryAxiom(
        `['keepplay-logs']
        | where type == "ad_event"
        | where isnotnull(nonce) and nonce != ""
        | project nonce, ad_id, revenue = toreal(revenue), ad_type, game_id, source, _time
        | order by _time desc`,
        startTime,
        endTime,
    );
}

/**
 * Game-side nonces with per-event details (game-side-reports).
 * Returns ALL events — nonce may be null if the SDK didn't send it.
 */
export async function getFraudGameNonces(startTime: string, endTime: string) {
    return queryAxiom(
        `['game-side-reports']
        | project nonce, ad_id, revenue_usd = toreal(revenue_usd), ad_type, game_id, ad_network, platform, _time
        | order by _time desc`,
        startTime,
        endTime,
    );
}

/**
 * Recent suspicious events — ad events with no integrity or mismatched data.
 */
export async function getFraudRecentSuspicious(startTime: string, endTime: string) {
    return queryAxiom(
        `['keepplay-logs']
        | where type == "ad_event"
        | where has_integrity == false or integrity_verified == false
        | order by _time desc
        | take 50
        | project _time, ad_id, ad_type, revenue, coins_earned, integrity_verdict, has_integrity, integrity_verified, source`,
        startTime,
        endTime,
    );
}

/**
 * Duplicate Nonce Detection — nonces that appear more than once in keepplay-logs.
 * A replayed nonce means someone is replaying a captured ad-revenue request.
 */
export async function getFraudDuplicateNonces(startTime: string, endTime: string) {
    return queryAxiom(
        `['keepplay-logs']
        | where type == "ad_event"
        | where isnotnull(nonce) and nonce != ""
        | summarize replay_count = count(), ad_ids = make_set(ad_id), total_revenue = sum(toreal(revenue)), first_seen = min(_time), last_seen = max(_time) by nonce
        | where replay_count > 1
        | order by replay_count desc
        | take 100`,
        startTime,
        endTime,
    );
}

/**
 * Revenue Pattern Analysis — per-user (ad_id) revenue statistics.
 * Used to detect abnormally high eCPM and suspiciously consistent revenue values.
 */
export async function getFraudRevenuePatterns(startTime: string, endTime: string) {
    return queryAxiom(
        `['keepplay-logs']
        | where type == "ad_event"
        | summarize total_revenue = sum(toreal(revenue)), event_count = count(), avg_revenue = avg(toreal(revenue)), min_revenue = min(toreal(revenue)), max_revenue = max(toreal(revenue)), distinct_values = dcount(tostring(toreal(revenue))), rewarded_count = countif(ad_type == "rewarded") by ad_id
        | where event_count >= 2
        | extend ecpm = (total_revenue / event_count) * 1000
        | extend revenue_spread = max_revenue - min_revenue
        | order by ecpm desc
        | take 200`,
        startTime,
        endTime,
    );
}

/**
 * Device Fingerprint Clustering — multiple ad_ids from the same device fingerprint.
 * Indicates factory-reset fraud to create fresh identities.
 */
export async function getFraudDeviceFingerprints(startTime: string, endTime: string) {
    return queryAxiom(
        `['keepplay-logs']
        | where type == "session_start"
        | where isnotnull(device_model) and isnotnull(android_version) and isnotnull(screen_resolution)
        | extend fingerprint = strcat(tostring(device_model), "|", tostring(android_version), "|", tostring(screen_resolution))
        | summarize ad_ids = make_set(ad_id), unique_ad_ids = dcount(ad_id), sessions = count(), first_seen = min(_time), last_seen = max(_time) by fingerprint, device_model, android_version, screen_resolution
        | where unique_ad_ids > 1
        | order by unique_ad_ids desc
        | take 50`,
        startTime,
        endTime,
    );
}

/**
 * Time-of-Day Heatmap — hourly distribution of ad events (24 rows).
 */
export async function getFraudHourlyHeatmap(startTime: string, endTime: string) {
    return queryAxiom(
        `['keepplay-logs']
        | where type == "ad_event"
        | extend hour = datetime_part("hour", _time)
        | summarize event_count = count(), unique_users = dcount(ad_id), total_revenue = sum(toreal(revenue)) by hour
        | order by hour asc`,
        startTime,
        endTime,
    );
}

/**
 * Night-owl users — users generating >30% of ad events between midnight and 6AM UTC.
 */
export async function getFraudNightOwlUsers(startTime: string, endTime: string) {
    return queryAxiom(
        `['keepplay-logs']
        | where type == "ad_event"
        | extend hour = datetime_part("hour", _time)
        | summarize total_events = count(), night_events = countif(hour >= 0 and hour < 6), total_revenue = sum(toreal(revenue)) by ad_id
        | where total_events >= 3 and night_events > 0
        | extend night_pct = (toreal(night_events) / toreal(total_events)) * 100.0
        | where night_pct > 30
        | order by night_pct desc
        | take 100`,
        startTime,
        endTime,
    );
}

/**
 * Coin-to-Withdrawal Velocity — time from first event to first withdrawal.
 * Fast withdrawals are suspicious.
 */
export async function getFraudWithdrawalVelocity(startTime: string, endTime: string) {
    return queryAxiom(
        `['keepplay-logs']
        | where type == "withdrawal_request" or type == "session_start"
        | summarize first_activity = minif(_time, type == "session_start"), first_withdrawal = minif(_time, type == "withdrawal_request"), withdrawal_count = countif(type == "withdrawal_request"), total_sessions = countif(type == "session_start") by ad_id
        | where isnotnull(first_withdrawal) and isnotnull(first_activity)
        | extend hours_to_withdrawal = datetime_diff("hour", todatetime(first_withdrawal), todatetime(first_activity))
        | extend days_to_withdrawal = toreal(hours_to_withdrawal) / 24.0
        | order by hours_to_withdrawal asc
        | take 100`,
        startTime,
        endTime,
    );
}

/**
 * Play Integrity Summary — global pass/fail/missing counts from full_init sessions only.
 * Refresh events are excluded because they never carry integrity tokens.
 */
export async function getFraudIntegritySummary(startTime: string, endTime: string) {
    return queryAxiom(
        `['keepplay-logs']
        | where type == "session_start" and session_type == "full_init"
        | summarize total = count(), passed = countif(has_integrity == true and integrity_verified == true), failed = countif(has_integrity == true and integrity_verified == false), missing = countif(has_integrity == false or isnull(has_integrity))`,
        startTime,
        endTime,
    );
}

/**
 * Play Integrity by User — per-user integrity pass rate, flagging users who never pass.
 * Only full_init sessions are counted (refreshes never carry integrity tokens).
 */
export async function getFraudIntegrityByUser(startTime: string, endTime: string) {
    return queryAxiom(
        `['keepplay-logs']
        | where type == "session_start" and session_type == "full_init"
        | summarize total_sessions = count(), passed = countif(has_integrity == true and integrity_verified == true), failed = countif(has_integrity == true and integrity_verified == false), missing = countif(has_integrity == false or isnull(has_integrity)), verdicts = make_set(integrity_verdict) by ad_id
        | extend pass_rate = iff(total_sessions > 0, (toreal(passed) / toreal(total_sessions)) * 100.0, 0.0)
        | order by pass_rate asc
        | take 200`,
        startTime,
        endTime,
    );
}

// ─────────────────────────────────────────────
// Dataset management — trim (purge) all data
// ─────────────────────────────────────────────

/**
 * Trim all data from a dataset.
 * Uses Axiom's trim API with maxDuration "1s" which removes
 * everything older than 1 second — effectively a full purge.
 */
export async function trimDataset(dataset: AxiomDataset): Promise<{ trimmedBlocksCount: number }> {
    const token = getAxiomToken();

    const res = await fetch(`${AXIOM_DATASETS_URL}/${encodeURIComponent(dataset)}/trim`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ maxDuration: "1s" }),
        cache: "no-store",
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Axiom trim failed for ${dataset} (${res.status}): ${text}`);
    }

    return res.json();
}
