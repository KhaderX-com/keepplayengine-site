"use client";

import { useState, useEffect, useCallback } from "react";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface AxiomTable {
    name: string;
    fields: Array<{ name: string; type: string }>;
    columns: Array<Array<unknown>>;
}

interface AxiomResponse {
    success: boolean;
    data?: {
        tables?: AxiomTable[];
        status?: {
            elapsedTime?: number;
            rowsExamined?: number;
            rowsMatched?: number;
        };
    };
    error?: string;
}

type TimeRange = "1h" | "6h" | "24h" | "7d" | "30d";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function getTimeRange(range: TimeRange): { startTime: string; endTime: string } {
    const now = new Date();
    const ms: Record<TimeRange, number> = {
        "1h": 60 * 60 * 1000,
        "6h": 6 * 60 * 60 * 1000,
        "24h": 24 * 60 * 60 * 1000,
        "7d": 7 * 24 * 60 * 60 * 1000,
        "30d": 30 * 24 * 60 * 60 * 1000,
    };
    return {
        startTime: new Date(now.getTime() - ms[range]).toISOString(),
        endTime: now.toISOString(),
    };
}

function parseTabular(tables?: AxiomTable[]): Record<string, unknown>[] {
    if (!tables || tables.length === 0) return [];
    const table = tables[0];
    if (!table.fields || !table.columns || table.columns.length === 0) return [];
    const fieldNames = table.fields.map((f) => f.name);
    const rowCount = table.columns[0]?.length ?? 0;
    const rows: Record<string, unknown>[] = [];
    for (let i = 0; i < rowCount; i++) {
        const row: Record<string, unknown> = {};
        for (let j = 0; j < fieldNames.length; j++) {
            row[fieldNames[j]] = table.columns[j]?.[i] ?? null;
        }
        rows.push(row);
    }
    return rows;
}

async function fetchAxiom(query: string, startTime: string, endTime: string): Promise<AxiomResponse> {
    const params = new URLSearchParams({ query, startTime, endTime });
    const res = await fetch(`/api/axiom/query?${params}`);
    return res.json();
}

function fmtNum(n: unknown): string {
    const v = Number(n);
    if (isNaN(v)) return "0";
    return v.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function fmtUsd(n: unknown): string {
    const v = Number(n);
    if (isNaN(v)) return "$0.00";
    return "$" + v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
}

function fmtTime(t: unknown): string {
    if (!t) return "—";
    return new Date(String(t)).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
}

// Fraud risk scoring
type RiskLevel = "clean" | "low" | "medium" | "high" | "critical";

function getRiskBadge(level: RiskLevel) {
    const styles: Record<RiskLevel, string> = {
        clean: "bg-emerald-50 text-emerald-700 border-emerald-200",
        low: "bg-blue-50 text-blue-700 border-blue-200",
        medium: "bg-amber-50 text-amber-700 border-amber-200",
        high: "bg-orange-50 text-orange-700 border-orange-200",
        critical: "bg-red-50 text-red-700 border-red-200",
    };
    const labels: Record<RiskLevel, string> = {
        clean: "Clean",
        low: "Low Risk",
        medium: "Medium Risk",
        high: "High Risk",
        critical: "Critical",
    };
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[level]}`}>
            {labels[level]}
        </span>
    );
}

function computeRiskLevel(
    serverRevenue: number,
    gameRevenue: number,
    integrityFailures: number,
    highFreqHours: number,
): RiskLevel {
    // No data at all
    if (serverRevenue === 0 && gameRevenue === 0) return "clean";

    let score = 0;

    // Revenue mismatch ratio
    if (gameRevenue > 0) {
        const diff = Math.abs(serverRevenue - gameRevenue);
        const ratio = diff / gameRevenue;
        if (ratio > 1.0) score += 40;
        else if (ratio > 0.5) score += 25;
        else if (ratio > 0.2) score += 10;
    } else if (serverRevenue > 0) {
        // Server reports revenue but game reports none
        score += 50;
    }

    // Integrity failures
    if (integrityFailures > 50) score += 40;
    else if (integrityFailures > 20) score += 25;
    else if (integrityFailures > 5) score += 10;

    // High frequency hours
    if (highFreqHours > 10) score += 20;
    else if (highFreqHours > 3) score += 10;

    if (score >= 70) return "critical";
    if (score >= 50) return "high";
    if (score >= 25) return "medium";
    if (score >= 10) return "low";
    return "clean";
}

// ─────────────────────────────────────────────
// Stat Card
// ─────────────────────────────────────────────

function StatCard({
    label,
    value,
    sub,
    color,
    loading,
}: {
    label: string;
    value: string | number;
    sub?: string;
    color: string;
    loading: boolean;
}) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
            <div className={`w-3 h-3 rounded-full mb-4 ${color}`} />
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
                {label}
            </p>
            {loading ? (
                <div className="h-9 w-24 bg-gray-100 rounded-lg animate-pulse" />
            ) : (
                <>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">{value}</p>
                    {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
                </>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────

export default function AntiFraudClient() {
    const [range, setRange] = useState<TimeRange>("24h");
    const [loading, setLoading] = useState(true);
    const [searchAdId, setSearchAdId] = useState("");

    // Danger zone state
    const [trimConfirm, setTrimConfirm] = useState<string | null>(null);
    const [trimTyped, setTrimTyped] = useState("");
    const [trimLoading, setTrimLoading] = useState(false);
    const [trimResult, setTrimResult] = useState<{ dataset: string; success: boolean; message: string } | null>(null);

    // Data states
    const [serverRevenue, setServerRevenue] = useState<Record<string, unknown>[]>([]);
    const [gameRevenue, setGameRevenue] = useState<Record<string, unknown>[]>([]);
    const [integrityFailures, setIntegrityFailures] = useState<Record<string, unknown>[]>([]);
    const [highFrequency, setHighFrequency] = useState<Record<string, unknown>[]>([]);
    const [serverTotals, setServerTotals] = useState<Record<string, unknown>[]>([]);
    const [gameTotals, setGameTotals] = useState<Record<string, unknown>[]>([]);
    const [recentSuspicious, setRecentSuspicious] = useState<Record<string, unknown>[]>([]);
    const [serverNonces, setServerNonces] = useState<Record<string, unknown>[]>([]);
    const [gameNonces, setGameNonces] = useState<Record<string, unknown>[]>([]);
    const [duplicateNonces, setDuplicateNonces] = useState<Record<string, unknown>[]>([]);
    const [revenuePatterns, setRevenuePatterns] = useState<Record<string, unknown>[]>([]);
    const [deviceFingerprints, setDeviceFingerprints] = useState<Record<string, unknown>[]>([]);
    const [hourlyHeatmap, setHourlyHeatmap] = useState<Record<string, unknown>[]>([]);
    const [nightOwlUsers, setNightOwlUsers] = useState<Record<string, unknown>[]>([]);
    const [withdrawalVelocity, setWithdrawalVelocity] = useState<Record<string, unknown>[]>([]);
    const [integritySummary, setIntegritySummary] = useState<Record<string, unknown>[]>([]);
    const [integrityByUser, setIntegrityByUser] = useState<Record<string, unknown>[]>([]);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        const { startTime, endTime } = getTimeRange(range);

        const results = await Promise.allSettled([
            fetchAxiom("fraud-server-revenue", startTime, endTime),
            fetchAxiom("fraud-game-revenue", startTime, endTime),
            fetchAxiom("fraud-integrity-failures", startTime, endTime),
            fetchAxiom("fraud-high-frequency", startTime, endTime),
            fetchAxiom("fraud-revenue-totals", startTime, endTime),
            fetchAxiom("fraud-game-revenue-totals", startTime, endTime),
            fetchAxiom("fraud-recent-suspicious", startTime, endTime),
            fetchAxiom("fraud-server-nonces", startTime, endTime),
            fetchAxiom("fraud-game-nonces", startTime, endTime),
            fetchAxiom("fraud-duplicate-nonces", startTime, endTime),
            fetchAxiom("fraud-revenue-patterns", startTime, endTime),
            fetchAxiom("fraud-device-fingerprints", startTime, endTime),
            fetchAxiom("fraud-hourly-heatmap", startTime, endTime),
            fetchAxiom("fraud-night-owl-users", startTime, endTime),
            fetchAxiom("fraud-withdrawal-velocity", startTime, endTime),
            fetchAxiom("fraud-integrity-summary", startTime, endTime),
            fetchAxiom("fraud-integrity-by-user", startTime, endTime),
        ]);

        const extract = (r: PromiseSettledResult<AxiomResponse>) =>
            r.status === "fulfilled" && r.value.success ? parseTabular(r.value.data?.tables) : [];

        setServerRevenue(extract(results[0]));
        setGameRevenue(extract(results[1]));
        setIntegrityFailures(extract(results[2]));
        setHighFrequency(extract(results[3]));
        setServerTotals(extract(results[4]));
        setGameTotals(extract(results[5]));
        setRecentSuspicious(extract(results[6]));
        setServerNonces(extract(results[7]));
        setGameNonces(extract(results[8]));
        setDuplicateNonces(extract(results[9]));
        setRevenuePatterns(extract(results[10]));
        setDeviceFingerprints(extract(results[11]));
        setHourlyHeatmap(extract(results[12]));
        setNightOwlUsers(extract(results[13]));
        setWithdrawalVelocity(extract(results[14]));
        setIntegritySummary(extract(results[15]));
        setIntegrityByUser(extract(results[16]));

        setLoading(false);
    }, [range]);

    useEffect(() => {
        void fetchAll();
    }, [fetchAll]);

    // Danger zone — purge dataset
    const handleTrim = async (dataset: string) => {
        setTrimLoading(true);
        setTrimResult(null);
        try {
            const res = await fetch("/api/axiom/trim", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ dataset }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setTrimResult({ dataset, success: true, message: `Purged ${dataset} — ${data.trimmedBlocksCount} blocks removed.` });
                // Refresh data
                void fetchAll();
            } else {
                setTrimResult({ dataset, success: false, message: data.error || "Unknown error" });
            }
        } catch (err) {
            setTrimResult({ dataset, success: false, message: err instanceof Error ? err.message : "Network error" });
        } finally {
            setTrimLoading(false);
            setTrimConfirm(null);
            setTrimTyped("");
        }
    };

    // Compute aggregate stats
    const totalServerRevenue = Number(serverTotals[0]?.server_total_revenue ?? 0);
    const totalGameRevenue = Number(gameTotals[0]?.game_total_revenue ?? 0);
    const totalServerEvents = Number(serverTotals[0]?.server_total_events ?? 0);
    const totalGameEvents = Number(gameTotals[0]?.game_total_events ?? 0);
    const revenueDiff = totalServerRevenue - totalGameRevenue;
    const revenueDiffPct = totalGameRevenue > 0
        ? ((revenueDiff / totalGameRevenue) * 100)
        : totalServerRevenue > 0 ? 100 : 0;
    const totalIntegrityFails = integrityFailures.reduce((s, r) => s + Number(r.failed_events ?? 0), 0);
    const totalSuspiciousUsers = highFrequency.length;

    // Overall risk
    const overallRisk = computeRiskLevel(totalServerRevenue, totalGameRevenue, totalIntegrityFails, totalSuspiciousUsers);

    // Build cross-layer comparison table (join by normalized ad_id)
    const normalize = (v: unknown) => String(v ?? "").trim().toLowerCase();
    const serverByAdId = new Map<string, Record<string, unknown>>();
    serverRevenue.forEach((r) => { const k = normalize(r.ad_id); if (k) serverByAdId.set(k, r); });
    const gameByAdId = new Map<string, Record<string, unknown>>();
    gameRevenue.forEach((r) => { const k = normalize(r.ad_id); if (k) gameByAdId.set(k, r); });

    const allAdIds = new Set<string>();
    serverByAdId.forEach((_, k) => allAdIds.add(k));
    gameByAdId.forEach((_, k) => allAdIds.add(k));

    const comparisonRows = Array.from(allAdIds)
        .map((key) => {
            const srv = serverByAdId.get(key);
            const gme = gameByAdId.get(key);
            const displayId = String(srv?.ad_id ?? gme?.ad_id ?? key);
            const integrity = integrityFailures.filter((r) => normalize(r.ad_id) === key);
            const freq = highFrequency.find((r) => normalize(r.ad_id) === key);

            const srvRev = Number(srv?.server_revenue ?? 0);
            const gmeRev = Number(gme?.game_revenue ?? 0);
            const srvEvents = Number(srv?.server_events ?? 0);
            const gmeEvents = Number(gme?.game_events ?? 0);
            const intFails = integrity.reduce((s, r) => s + Number(r.failed_events ?? 0), 0);
            const freqHours = Number(freq?.suspicious_hours ?? 0);

            const diff = srvRev - gmeRev;
            const diffPct = gmeRev > 0 ? (diff / gmeRev) * 100 : srvRev > 0 ? 100 : 0;
            const risk = computeRiskLevel(srvRev, gmeRev, intFails, freqHours);

            return {
                key,
                adId: displayId,
                srvRev, gmeRev, srvEvents, gmeEvents,
                diff, diffPct, intFails, freqHours,
                maxEventsInHour: Number(freq?.max_events_in_hour ?? 0),
                risk,
            };
        })
        .sort((a, b) => {
            const riskOrder: Record<RiskLevel, number> = { critical: 0, high: 1, medium: 2, low: 3, clean: 4 };
            return riskOrder[a.risk] - riskOrder[b.risk] || b.diff - a.diff;
        });

    // Filter by search
    const filteredRows = searchAdId.trim()
        ? comparisonRows.filter((r) => r.adId.toLowerCase().includes(searchAdId.toLowerCase()))
        : comparisonRows;

    // Filter server & game rows by search (for raw tables)
    const filteredServerRows = searchAdId.trim()
        ? serverRevenue.filter((r) => String(r.ad_id ?? "").toLowerCase().includes(searchAdId.toLowerCase()))
        : serverRevenue;

    const filteredGameRows = searchAdId.trim()
        ? gameRevenue.filter((r) => String(r.ad_id ?? "").toLowerCase().includes(searchAdId.toLowerCase()))
        : gameRevenue;

    // ─── Nonce-based event matching ───────────────────────────────
    type NonceStatus = "matched" | "tampered" | "server-only" | "game-only" | "missing-nonce";
    interface NonceRow {
        nonce: string;
        status: NonceStatus;
        srvRev: number;
        gmeRev: number;
        revDiff: number;
        adId: string;
        adType: string;
        gameId: string;
        source: string;
        srvTime: string;
        gmeTime: string;
    }

    const srvNonceMap = new Map<string, Record<string, unknown>>();
    serverNonces.forEach((r) => {
        const n = normalize(r.nonce);
        if (n) srvNonceMap.set(n, r);
    });
    const gmeNonceMap = new Map<string, Record<string, unknown>>();
    const gmeWithoutNonce: Record<string, unknown>[] = [];
    gameNonces.forEach((r) => {
        const n = normalize(r.nonce);
        if (n) {
            gmeNonceMap.set(n, r);
        } else {
            gmeWithoutNonce.push(r);
        }
    });

    const allNonces = new Set<string>();
    srvNonceMap.forEach((_, k) => allNonces.add(k));
    gmeNonceMap.forEach((_, k) => allNonces.add(k));

    const nonceRows: NonceRow[] = Array.from(allNonces).map((nonce) => {
        const srv = srvNonceMap.get(nonce);
        const gme = gmeNonceMap.get(nonce);
        const srvRev = Number(srv?.revenue ?? 0);
        const gmeRev = Number(gme?.revenue_usd ?? 0);
        const revDiff = Math.abs(srvRev - gmeRev);

        let status: NonceStatus;
        if (srv && gme) {
            status = revDiff > 0.0001 ? "tampered" : "matched";
        } else if (srv && !gme) {
            status = "server-only";
        } else {
            status = "game-only";
        }

        return {
            nonce,
            status,
            srvRev,
            gmeRev,
            revDiff,
            adId: String(srv?.ad_id ?? gme?.ad_id ?? "—"),
            adType: String(srv?.ad_type ?? gme?.ad_type ?? "—"),
            gameId: String(srv?.game_id ?? gme?.game_id ?? "—"),
            source: String(srv?.source ?? gme?.ad_network ?? gme?.platform ?? "—"),
            srvTime: String(srv?._time ?? ""),
            gmeTime: String(gme?._time ?? ""),
        };
    });

    // Add game-side events that have NO nonce at all (SDK bug)
    gmeWithoutNonce.forEach((r, i) => {
        nonceRows.push({
            nonce: `(missing-${i + 1})`,
            status: "missing-nonce",
            srvRev: 0,
            gmeRev: Number(r.revenue_usd ?? 0),
            revDiff: Number(r.revenue_usd ?? 0),
            adId: String(r.ad_id ?? "—"),
            adType: String(r.ad_type ?? "—"),
            gameId: String(r.game_id ?? "—"),
            source: String(r.ad_network ?? r.platform ?? "—"),
            srvTime: "",
            gmeTime: String(r._time ?? ""),
        });
    });

    // Sort: tampered first, then missing-nonce, server-only, game-only, matched last
    const nonceStatusOrder: Record<NonceStatus, number> = { tampered: 0, "missing-nonce": 1, "server-only": 2, "game-only": 3, matched: 4 };
    nonceRows.sort((a, b) => nonceStatusOrder[a.status] - nonceStatusOrder[b.status]);

    const nonceMatched = nonceRows.filter((r) => r.status === "matched").length;
    const nonceTampered = nonceRows.filter((r) => r.status === "tampered").length;
    const nonceServerOnly = nonceRows.filter((r) => r.status === "server-only").length;
    const nonceGameOnly = nonceRows.filter((r) => r.status === "game-only").length;
    const nonceMissing = nonceRows.filter((r) => r.status === "missing-nonce").length;
    const nonceTotalEvents = nonceRows.length;

    // Filter nonce rows by search
    const [nonceFilter, setNonceFilter] = useState<"all" | NonceStatus>("all");
    const filteredNonceRows = nonceRows.filter((r) => {
        if (nonceFilter !== "all" && r.status !== nonceFilter) return false;
        if (searchAdId.trim() && !r.adId.toLowerCase().includes(searchAdId.toLowerCase()) && !r.nonce.toLowerCase().includes(searchAdId.toLowerCase())) return false;
        return true;
    });

    const ranges: TimeRange[] = ["1h", "6h", "24h", "7d", "30d"];

    return (
        <div className="space-y-6 sm:space-y-8">
            {/* Header Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    {ranges.map((r) => (
                        <button
                            key={r}
                            onClick={() => setRange(r)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                                range === r
                                    ? "bg-red-600 text-white shadow-sm"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                        >
                            {r}
                        </button>
                    ))}
                </div>
                <button
                    onClick={fetchAll}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-all"
                >
                    <svg className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {loading ? "Scanning…" : "Refresh"}
                </button>
            </div>

            {/* Overall Risk Banner */}
            <div className={`rounded-2xl border-2 p-6 ${
                overallRisk === "critical" ? "bg-red-50 border-red-300" :
                overallRisk === "high" ? "bg-orange-50 border-orange-300" :
                overallRisk === "medium" ? "bg-amber-50 border-amber-300" :
                overallRisk === "low" ? "bg-blue-50 border-blue-200" :
                "bg-emerald-50 border-emerald-200"
            }`}>
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                            overallRisk === "critical" || overallRisk === "high" ? "bg-red-100" :
                            overallRisk === "medium" ? "bg-amber-100" :
                            "bg-emerald-100"
                        }`}>
                            <svg className={`w-7 h-7 ${
                                overallRisk === "critical" || overallRisk === "high" ? "text-red-600" :
                                overallRisk === "medium" ? "text-amber-600" :
                                "text-emerald-600"
                            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Overall Fraud Risk</h3>
                            <p className="text-sm text-gray-600 mt-0.5">
                                Cross-layer comparison for the selected period
                            </p>
                        </div>
                    </div>
                    {getRiskBadge(overallRisk)}
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Server Revenue"
                    value={fmtUsd(totalServerRevenue)}
                    sub={`${fmtNum(totalServerEvents)} events (keepplay-logs)`}
                    color="bg-indigo-500"
                    loading={loading}
                />
                <StatCard
                    label="Game Revenue"
                    value={fmtUsd(totalGameRevenue)}
                    sub={`${fmtNum(totalGameEvents)} events (game-side-reports)`}
                    color="bg-emerald-500"
                    loading={loading}
                />
                <StatCard
                    label="Revenue Mismatch"
                    value={loading ? "…" : `${revenueDiffPct >= 0 ? "+" : ""}${revenueDiffPct.toFixed(1)}%`}
                    sub={`Δ ${fmtUsd(Math.abs(revenueDiff))}`}
                    color={Math.abs(revenueDiffPct) > 20 ? "bg-red-500" : "bg-amber-500"}
                    loading={loading}
                />
                <StatCard
                    label="Integrity Failures"
                    value={fmtNum(totalIntegrityFails)}
                    sub={`${totalSuspiciousUsers} high-frequency users`}
                    color={totalIntegrityFails > 0 ? "bg-red-500" : "bg-emerald-500"}
                    loading={loading}
                />
            </div>

            {/* How It Works */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    How Anti-Fraud Detection Works
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs text-gray-600">
                    <div className="bg-gray-50 rounded-xl p-4">
                        <p className="font-semibold text-gray-800 mb-1">1. Cross-Layer Revenue Comparison</p>
                        <p>Compares <code className="bg-gray-200 px-1 rounded">keepplay-logs</code> (Kotlin/Edge Functions server-side) vs <code className="bg-gray-200 px-1 rounded">game-side-reports</code> (Game SDK). If a user reports revenue on the server that the game never saw, it&apos;s likely spoofed.</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                        <p className="font-semibold text-gray-800 mb-1">2. Integrity Verification</p>
                        <p>Each ad event carries <code className="bg-gray-200 px-1 rounded">has_integrity</code> and <code className="bg-gray-200 px-1 rounded">integrity_verified</code> flags. Failed integrity means the event couldn&apos;t be cryptographically verified — a strong fraud signal.</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                        <p className="font-semibold text-gray-800 mb-1">3. Frequency Analysis</p>
                        <p>Users firing &gt;120 ad events per hour are flagged. Legitimate users rarely watch that many ads. Bots and auto-clickers produce abnormal spikes.</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                        <p className="font-semibold text-gray-800 mb-1">4. Nonce-Based Event Matching</p>
                        <p>Every ad event has a unique <code className="bg-gray-200 px-1 rounded">nonce</code>. We match individual events across both datasets. Orphaned or tampered nonces reveal spoofed or injected events.</p>
                    </div>
                </div>
            </div>

            {/* Revenue Totals Comparison */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Cross-Layer Revenue Totals
                </h3>
                {loading ? (
                    <div className="h-16 bg-gray-50 rounded-xl animate-pulse" />
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-indigo-50 rounded-xl p-4 text-center">
                            <p className="text-[10px] font-semibold text-indigo-500 uppercase tracking-widest mb-1">Server (keepplay-logs)</p>
                            <p className="text-xl font-bold text-gray-900">{fmtUsd(totalServerRevenue)}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{fmtNum(totalServerEvents)} events</p>
                        </div>
                        <div className={`rounded-xl p-4 text-center ${Math.abs(revenueDiffPct) > 20 ? "bg-red-50" : Math.abs(revenueDiffPct) > 5 ? "bg-amber-50" : "bg-emerald-50"}`}>
                            <p className={`text-[10px] font-semibold uppercase tracking-widest mb-1 ${Math.abs(revenueDiffPct) > 20 ? "text-red-500" : Math.abs(revenueDiffPct) > 5 ? "text-amber-500" : "text-emerald-500"}`}>Difference</p>
                            <p className={`text-xl font-bold ${Math.abs(revenueDiffPct) > 20 ? "text-red-700" : Math.abs(revenueDiffPct) > 5 ? "text-amber-700" : "text-emerald-700"}`}>
                                {revenueDiffPct >= 0 ? "+" : ""}{revenueDiffPct.toFixed(1)}%
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">Δ {fmtUsd(Math.abs(revenueDiff))}</p>
                        </div>
                        <div className="bg-emerald-50 rounded-xl p-4 text-center">
                            <p className="text-[10px] font-semibold text-emerald-500 uppercase tracking-widest mb-1">Game (game-side-reports)</p>
                            <p className="text-xl font-bold text-gray-900">{fmtUsd(totalGameRevenue)}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{fmtNum(totalGameEvents)} events</p>
                        </div>
                    </div>
                )}
            </div>

            {/* ═══ NONCE-BASED EVENT MATCHING ═══ */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="p-5 sm:p-6 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                        <h3 className="text-sm font-bold text-gray-900">Nonce-Based Event Matching</h3>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Individual event verification — every ad event has a unique nonce matched across both datasets
                    </p>
                </div>

                {/* Nonce summary cards */}
                {loading ? (
                    <div className="p-6">
                        <div className="h-20 bg-gray-50 rounded-xl animate-pulse" />
                    </div>
                ) : nonceTotalEvents === 0 ? (
                    <div className="p-8 text-center">
                        <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                        </div>
                        <p className="text-sm font-semibold text-gray-700">No nonce data available</p>
                        <p className="text-xs text-gray-500 mt-1">No events with nonces found in this period. Make sure both the Edge Function and SDK are sending the nonce field.</p>
                    </div>
                ) : (
                    <>
                        <div className="p-5 sm:p-6">
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                <button
                                    onClick={() => setNonceFilter(nonceFilter === "matched" ? "all" : "matched")}
                                    className={`rounded-xl p-4 text-center transition-all border-2 ${
                                        nonceFilter === "matched" ? "border-emerald-400 bg-emerald-50" : "border-transparent bg-emerald-50/50 hover:bg-emerald-50"
                                    }`}
                                >
                                    <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-widest mb-0.5">Matched</p>
                                    <p className="text-2xl font-bold text-emerald-700">{fmtNum(nonceMatched)}</p>
                                    <p className="text-[10px] text-emerald-600 mt-0.5">Both sides confirmed</p>
                                </button>
                                <button
                                    onClick={() => setNonceFilter(nonceFilter === "tampered" ? "all" : "tampered")}
                                    className={`rounded-xl p-4 text-center transition-all border-2 ${
                                        nonceFilter === "tampered" ? "border-red-400 bg-red-50" : "border-transparent bg-red-50/50 hover:bg-red-50"
                                    }`}
                                >
                                    <p className="text-[10px] font-semibold text-red-600 uppercase tracking-widest mb-0.5">Tampered</p>
                                    <p className="text-2xl font-bold text-red-700">{fmtNum(nonceTampered)}</p>
                                    <p className="text-[10px] text-red-600 mt-0.5">Revenue mismatch</p>
                                </button>
                                <button
                                    onClick={() => setNonceFilter(nonceFilter === "server-only" ? "all" : "server-only")}
                                    className={`rounded-xl p-4 text-center transition-all border-2 ${
                                        nonceFilter === "server-only" ? "border-orange-400 bg-orange-50" : "border-transparent bg-orange-50/50 hover:bg-orange-50"
                                    }`}
                                >
                                    <p className="text-[10px] font-semibold text-orange-600 uppercase tracking-widest mb-0.5">Server Only</p>
                                    <p className="text-2xl font-bold text-orange-700">{fmtNum(nonceServerOnly)}</p>
                                    <p className="text-[10px] text-orange-600 mt-0.5">Missing from game SDK</p>
                                </button>
                                <button
                                    onClick={() => setNonceFilter(nonceFilter === "game-only" ? "all" : "game-only")}
                                    className={`rounded-xl p-4 text-center transition-all border-2 ${
                                        nonceFilter === "game-only" ? "border-violet-400 bg-violet-50" : "border-transparent bg-violet-50/50 hover:bg-violet-50"
                                    }`}
                                >
                                    <p className="text-[10px] font-semibold text-violet-600 uppercase tracking-widest mb-0.5">Game Only</p>
                                    <p className="text-2xl font-bold text-violet-700">{fmtNum(nonceGameOnly)}</p>
                                    <p className="text-[10px] text-violet-600 mt-0.5">SDK spoofed report</p>
                                </button>
                                <button
                                    onClick={() => setNonceFilter(nonceFilter === "missing-nonce" ? "all" : "missing-nonce")}
                                    className={`rounded-xl p-4 text-center transition-all border-2 ${
                                        nonceFilter === "missing-nonce" ? "border-pink-400 bg-pink-50" : "border-transparent bg-pink-50/50 hover:bg-pink-50"
                                    }`}
                                >
                                    <p className="text-[10px] font-semibold text-pink-600 uppercase tracking-widest mb-0.5">Missing Nonce</p>
                                    <p className="text-2xl font-bold text-pink-700">{fmtNum(nonceMissing)}</p>
                                    <p className="text-[10px] text-pink-600 mt-0.5">SDK sent no nonce</p>
                                </button>
                            </div>

                            {/* Nonce health bar */}
                            {nonceTotalEvents > 0 && (
                                <div className="mt-4">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Match Rate</p>
                                        <p className="text-xs font-bold text-gray-700">
                                            {((nonceMatched / nonceTotalEvents) * 100).toFixed(1)}% verified
                                        </p>
                                    </div>
                                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden flex">
                                        {nonceMatched > 0 && (
                                            <div className="bg-emerald-500 h-full transition-all" style={{ width: `${(nonceMatched / nonceTotalEvents) * 100}%` }} title={`${nonceMatched} matched`} />
                                        )}
                                        {nonceTampered > 0 && (
                                            <div className="bg-red-500 h-full transition-all" style={{ width: `${(nonceTampered / nonceTotalEvents) * 100}%` }} title={`${nonceTampered} tampered`} />
                                        )}
                                        {nonceServerOnly > 0 && (
                                            <div className="bg-orange-400 h-full transition-all" style={{ width: `${(nonceServerOnly / nonceTotalEvents) * 100}%` }} title={`${nonceServerOnly} server-only`} />
                                        )}
                                        {nonceGameOnly > 0 && (
                                            <div className="bg-violet-400 h-full transition-all" style={{ width: `${(nonceGameOnly / nonceTotalEvents) * 100}%` }} title={`${nonceGameOnly} game-only`} />
                                        )}
                                        {nonceMissing > 0 && (
                                            <div className="bg-pink-400 h-full transition-all" style={{ width: `${(nonceMissing / nonceTotalEvents) * 100}%` }} title={`${nonceMissing} missing nonce`} />
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4 mt-2 flex-wrap">
                                        <span className="flex items-center gap-1 text-[10px] text-gray-500"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Matched</span>
                                        <span className="flex items-center gap-1 text-[10px] text-gray-500"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Tampered</span>
                                        <span className="flex items-center gap-1 text-[10px] text-gray-500"><span className="w-2 h-2 rounded-full bg-orange-400 inline-block" /> Server Only</span>
                                        <span className="flex items-center gap-1 text-[10px] text-gray-500"><span className="w-2 h-2 rounded-full bg-violet-400 inline-block" /> Game Only</span>
                                        <span className="flex items-center gap-1 text-[10px] text-gray-500"><span className="w-2 h-2 rounded-full bg-pink-400 inline-block" /> Missing Nonce</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Nonce event table */}
                        {filteredNonceRows.length > 0 && (
                            <>
                                <div className="overflow-x-auto border-t border-gray-100">
                                    <table className="w-full text-xs">
                                        <thead>
                                            <tr className="border-b border-gray-100 text-left">
                                                <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                                <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider">Nonce</th>
                                                <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider">Ad ID</th>
                                                <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider text-right">Server Rev</th>
                                                <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider text-right">Game Rev</th>
                                                <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider text-right">Δ Diff</th>
                                                <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider">Ad Type</th>
                                                <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider">Source</th>
                                                <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider">Time</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {filteredNonceRows.map((row) => {
                                                const statusStyles: Record<NonceStatus, { bg: string; text: string; label: string }> = {
                                                    matched: { bg: "bg-emerald-50", text: "text-emerald-700", label: "✓ Matched" },
                                                    tampered: { bg: "bg-red-50", text: "text-red-700", label: "⚠ Tampered" },
                                                    "server-only": { bg: "bg-orange-50", text: "text-orange-700", label: "● Server Only" },
                                                    "game-only": { bg: "bg-violet-50", text: "text-violet-700", label: "● Game Only" },
                                                    "missing-nonce": { bg: "bg-pink-50", text: "text-pink-700", label: "⊘ No Nonce" },
                                                };
                                                const s = statusStyles[row.status];
                                                return (
                                                    <tr key={row.nonce} className={`hover:bg-gray-50/80 transition-colors ${
                                                        row.status === "tampered" ? "bg-red-50/30" :
                                                        row.status === "server-only" ? "bg-orange-50/20" :
                                                        row.status === "game-only" ? "bg-violet-50/20" :
                                                        row.status === "missing-nonce" ? "bg-pink-50/20" : ""
                                                    }`}>
                                                        <td className="px-5 py-3">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${s.bg} ${s.text} border-current/20`}>
                                                                {s.label}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-3 font-mono text-gray-700 max-w-32 truncate" title={row.nonce}>
                                                            {row.nonce.length > 16 ? row.nonce.slice(0, 8) + "…" + row.nonce.slice(-8) : row.nonce}
                                                        </td>
                                                        <td className="px-5 py-3 font-mono text-gray-800 max-w-36 truncate" title={row.adId}>
                                                            {row.adId}
                                                        </td>
                                                        <td className={`px-5 py-3 text-right font-medium ${row.srvRev > 0 ? "text-gray-900" : "text-gray-400"}`}>
                                                            {row.srvRev > 0 ? fmtUsd(row.srvRev) : "—"}
                                                        </td>
                                                        <td className={`px-5 py-3 text-right font-medium ${row.gmeRev > 0 ? "text-gray-900" : "text-gray-400"}`}>
                                                            {row.gmeRev > 0 ? fmtUsd(row.gmeRev) : "—"}
                                                        </td>
                                                        <td className={`px-5 py-3 text-right font-bold ${
                                                            row.status === "tampered" ? "text-red-600" :
                                                            row.status === "server-only" || row.status === "game-only" ? "text-orange-600" :
                                                            "text-gray-400"
                                                        }`}>
                                                            {row.status === "matched" ? "—" : row.revDiff > 0 ? fmtUsd(row.revDiff) : fmtUsd(Math.max(row.srvRev, row.gmeRev))}
                                                        </td>
                                                        <td className="px-5 py-3 text-gray-700">{row.adType}</td>
                                                        <td className="px-5 py-3 text-gray-600">{row.source}</td>
                                                        <td className="px-5 py-3 text-gray-600 whitespace-nowrap">{fmtTime(row.srvTime || row.gmeTime)}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-500">
                                    Showing {filteredNonceRows.length} of {nonceTotalEvents} events •{" "}
                                    {nonceTampered + nonceServerOnly + nonceGameOnly + nonceMissing}{" "}
                                    anomal{nonceTampered + nonceServerOnly + nonceGameOnly + nonceMissing !== 1 ? "ies" : "y"}
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>

            {/* ═══ DUPLICATE NONCE DETECTION ═══ */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="p-5 sm:p-6 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3 className="text-sm font-bold text-gray-900">Duplicate Nonce Detection</h3>
                        {duplicateNonces.length > 0 && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                                {duplicateNonces.length} REPLAY{duplicateNonces.length !== 1 ? "S" : ""}
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Flags nonces that appear more than once in keepplay-logs — a replayed nonce means someone is replaying a captured ad-revenue request to double-credit coins
                    </p>
                </div>
                {loading ? (
                    <div className="p-6"><div className="h-16 bg-gray-50 rounded-xl animate-pulse" /></div>
                ) : duplicateNonces.length === 0 ? (
                    <div className="p-8 text-center">
                        <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                            <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <p className="text-sm font-semibold text-gray-700">No Replay Attacks Detected</p>
                        <p className="text-xs text-gray-500 mt-1">All nonces in this period are unique — no duplicate requests found.</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b border-gray-100 text-left">
                                        <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider">Severity</th>
                                        <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider">Nonce</th>
                                        <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider text-right">Replay Count</th>
                                        <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider">Ad IDs</th>
                                        <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider text-right">Total Revenue</th>
                                        <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider">First Seen</th>
                                        <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider">Last Seen</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {duplicateNonces.map((row) => {
                                        const count = Number(row.replay_count ?? 0);
                                        const severity = count >= 10 ? "critical" : count >= 5 ? "high" : "medium";
                                        const sevStyles = {
                                            critical: { bg: "bg-red-50", text: "text-red-700", label: "CRITICAL" },
                                            high: { bg: "bg-orange-50", text: "text-orange-700", label: "HIGH" },
                                            medium: { bg: "bg-amber-50", text: "text-amber-700", label: "MEDIUM" },
                                        };
                                        const s = sevStyles[severity];
                                        const nonceStr = String(row.nonce ?? "");
                                        const adIds = Array.isArray(row.ad_ids) ? row.ad_ids.map(String) : [String(row.ad_ids ?? "—")];
                                        return (
                                            <tr key={nonceStr} className={`hover:bg-gray-50/80 transition-colors ${
                                                severity === "critical" ? "bg-red-50/30" : severity === "high" ? "bg-orange-50/20" : ""
                                            }`}>
                                                <td className="px-5 py-3">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${s.bg} ${s.text} border-current/20`}>
                                                        {s.label}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3 font-mono text-gray-700 max-w-40 truncate" title={nonceStr}>
                                                    {nonceStr.length > 20 ? nonceStr.slice(0, 10) + "…" + nonceStr.slice(-10) : nonceStr}
                                                </td>
                                                <td className="px-5 py-3 text-right font-bold text-red-600">{count}×</td>
                                                <td className="px-5 py-3 font-mono text-gray-600 max-w-48 truncate" title={adIds.join(", ")}>
                                                    {adIds.length > 2 ? `${adIds[0]}, +${adIds.length - 1} more` : adIds.join(", ")}
                                                </td>
                                                <td className="px-5 py-3 text-right font-medium text-gray-900">{fmtUsd(row.total_revenue)}</td>
                                                <td className="px-5 py-3 text-gray-600 whitespace-nowrap">{fmtTime(row.first_seen)}</td>
                                                <td className="px-5 py-3 text-gray-600 whitespace-nowrap">{fmtTime(row.last_seen)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-500">
                            {duplicateNonces.length} replayed nonce{duplicateNonces.length !== 1 ? "s" : ""} detected •
                            Total extra revenue: {fmtUsd(duplicateNonces.reduce((sum, r) => sum + Number(r.total_revenue ?? 0), 0))}
                        </div>
                    </>
                )}
            </div>

            {/* ═══ REVENUE PATTERN ANALYSIS ═══ */}
            {(() => {
                // Compute global average eCPM
                const allEcpms = revenuePatterns.map((r) => Number(r.ecpm ?? 0)).filter((v) => v > 0);
                const globalAvgEcpm = allEcpms.length > 0 ? allEcpms.reduce((a, b) => a + b, 0) / allEcpms.length : 0;
                const ecpmThreshold = globalAvgEcpm * 3;

                // High eCPM users (>3x global average)
                const highEcpmUsers = revenuePatterns.filter((r) => Number(r.ecpm ?? 0) > ecpmThreshold && globalAvgEcpm > 0);

                // Suspicious consistency: users with low distinct revenue values relative to event count
                // If you have 10+ events but only 1-2 distinct revenue values, that's suspicious (bots)
                const suspiciousConsistency = revenuePatterns.filter((r) => {
                    const events = Number(r.event_count ?? 0);
                    const distinct = Number(r.distinct_values ?? 0);
                    const spread = Number(r.revenue_spread ?? 0);
                    // At least 3 events, and distinct values are suspiciously low
                    return events >= 3 && distinct <= 2 && spread < 0.001;
                });

                // Combined flagged users (union)
                const flaggedAdIds = new Set<string>();
                highEcpmUsers.forEach((r) => flaggedAdIds.add(String(r.ad_id)));
                suspiciousConsistency.forEach((r) => flaggedAdIds.add(String(r.ad_id)));
                const totalFlagged = flaggedAdIds.size;

                return (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                        <div className="p-5 sm:p-6 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                <h3 className="text-sm font-bold text-gray-900">Revenue Pattern Analysis</h3>
                                {totalFlagged > 0 && (
                                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                                        {totalFlagged} FLAGGED
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Detects abnormally high eCPM (&gt;3× global average) and suspiciously consistent revenue values (bot behavior)
                            </p>
                        </div>

                        {loading ? (
                            <div className="p-6"><div className="h-16 bg-gray-50 rounded-xl animate-pulse" /></div>
                        ) : revenuePatterns.length === 0 ? (
                            <div className="p-8 text-center">
                                <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                    </svg>
                                </div>
                                <p className="text-sm font-semibold text-gray-700">Not enough data</p>
                                <p className="text-xs text-gray-500 mt-1">Need at least 2 ad events per user to analyze revenue patterns.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {/* Global stats bar */}
                                <div className="p-5 sm:p-6">
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        <div className="bg-gray-50 rounded-xl p-4 text-center">
                                            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-0.5">Users Analyzed</p>
                                            <p className="text-2xl font-bold text-gray-900">{fmtNum(revenuePatterns.length)}</p>
                                        </div>
                                        <div className="bg-indigo-50 rounded-xl p-4 text-center">
                                            <p className="text-[10px] font-semibold text-indigo-500 uppercase tracking-widest mb-0.5">Global Avg eCPM</p>
                                            <p className="text-2xl font-bold text-indigo-700">{fmtUsd(globalAvgEcpm)}</p>
                                        </div>
                                        <div className={`rounded-xl p-4 text-center ${highEcpmUsers.length > 0 ? "bg-red-50" : "bg-emerald-50"}`}>
                                            <p className={`text-[10px] font-semibold uppercase tracking-widest mb-0.5 ${highEcpmUsers.length > 0 ? "text-red-500" : "text-emerald-500"}`}>High eCPM (&gt;3×)</p>
                                            <p className={`text-2xl font-bold ${highEcpmUsers.length > 0 ? "text-red-700" : "text-emerald-700"}`}>{fmtNum(highEcpmUsers.length)}</p>
                                        </div>
                                        <div className={`rounded-xl p-4 text-center ${suspiciousConsistency.length > 0 ? "bg-amber-50" : "bg-emerald-50"}`}>
                                            <p className={`text-[10px] font-semibold uppercase tracking-widest mb-0.5 ${suspiciousConsistency.length > 0 ? "text-amber-500" : "text-emerald-500"}`}>Suspicious Consistency</p>
                                            <p className={`text-2xl font-bold ${suspiciousConsistency.length > 0 ? "text-amber-700" : "text-emerald-700"}`}>{fmtNum(suspiciousConsistency.length)}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* High eCPM Users subsection */}
                                {highEcpmUsers.length > 0 && (
                                    <div>
                                        <div className="px-5 pt-5 sm:px-6 sm:pt-6">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="w-2 h-2 rounded-full bg-red-500" />
                                                <h4 className="text-xs font-bold text-gray-800">Abnormally High eCPM Users</h4>
                                            </div>
                                            <p className="text-[10px] text-gray-500 mb-3">Users with eCPM &gt; {fmtUsd(ecpmThreshold)} (3× the global average of {fmtUsd(globalAvgEcpm)})</p>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-xs">
                                                <thead>
                                                    <tr className="border-b border-gray-100 text-left">
                                                        <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider">Risk</th>
                                                        <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider">Ad ID</th>
                                                        <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider text-right">eCPM</th>
                                                        <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider text-right">vs Global</th>
                                                        <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider text-right">Total Rev</th>
                                                        <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider text-right">Events</th>
                                                        <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider text-right">Avg Rev</th>
                                                        <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider text-right">Rewarded %</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50">
                                                    {highEcpmUsers.map((row) => {
                                                        const ecpm = Number(row.ecpm ?? 0);
                                                        const ratio = globalAvgEcpm > 0 ? ecpm / globalAvgEcpm : 0;
                                                        const events = Number(row.event_count ?? 0);
                                                        const rewarded = Number(row.rewarded_count ?? 0);
                                                        const rewPct = events > 0 ? (rewarded / events) * 100 : 0;
                                                        return (
                                                            <tr key={String(row.ad_id)} className="hover:bg-gray-50/80 transition-colors bg-red-50/20">
                                                                <td className="px-5 py-3">
                                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                                                        ratio >= 10 ? "bg-red-50 text-red-700 border-red-200" :
                                                                        ratio >= 5 ? "bg-orange-50 text-orange-700 border-orange-200" :
                                                                        "bg-amber-50 text-amber-700 border-amber-200"
                                                                    }`}>
                                                                        {ratio >= 10 ? "CRITICAL" : ratio >= 5 ? "HIGH" : "ELEVATED"}
                                                                    </span>
                                                                </td>
                                                                <td className="px-5 py-3 font-mono text-gray-800 max-w-40 truncate" title={String(row.ad_id)}>{String(row.ad_id)}</td>
                                                                <td className="px-5 py-3 text-right font-bold text-red-600">{fmtUsd(ecpm)}</td>
                                                                <td className="px-5 py-3 text-right font-bold text-red-600">{ratio.toFixed(1)}×</td>
                                                                <td className="px-5 py-3 text-right font-medium text-gray-900">{fmtUsd(row.total_revenue)}</td>
                                                                <td className="px-5 py-3 text-right text-gray-700">{fmtNum(events)}</td>
                                                                <td className="px-5 py-3 text-right text-gray-700">{fmtUsd(row.avg_revenue)}</td>
                                                                <td className="px-5 py-3 text-right text-gray-700">{rewPct.toFixed(0)}%</td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* Suspicious Consistency subsection */}
                                {suspiciousConsistency.length > 0 && (
                                    <div>
                                        <div className="px-5 pt-5 sm:px-6 sm:pt-6">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="w-2 h-2 rounded-full bg-amber-500" />
                                                <h4 className="text-xs font-bold text-gray-800">Suspiciously Consistent Revenue</h4>
                                            </div>
                                            <p className="text-[10px] text-gray-500 mb-3">Users with ≤2 distinct revenue values across 3+ events and near-zero spread — typical bot behavior</p>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-xs">
                                                <thead>
                                                    <tr className="border-b border-gray-100 text-left">
                                                        <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider">Pattern</th>
                                                        <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider">Ad ID</th>
                                                        <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider text-right">Events</th>
                                                        <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider text-right">Distinct Values</th>
                                                        <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider text-right">Revenue Spread</th>
                                                        <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider text-right">Avg Rev</th>
                                                        <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider text-right">Total Rev</th>
                                                        <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider text-right">Rewarded %</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50">
                                                    {suspiciousConsistency.map((row) => {
                                                        const events = Number(row.event_count ?? 0);
                                                        const distinct = Number(row.distinct_values ?? 0);
                                                        const rewarded = Number(row.rewarded_count ?? 0);
                                                        const rewPct = events > 0 ? (rewarded / events) * 100 : 0;
                                                        return (
                                                            <tr key={String(row.ad_id)} className="hover:bg-gray-50/80 transition-colors bg-amber-50/20">
                                                                <td className="px-5 py-3">
                                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                                                        {distinct === 1 ? "IDENTICAL" : "NEAR-IDENTICAL"}
                                                                    </span>
                                                                </td>
                                                                <td className="px-5 py-3 font-mono text-gray-800 max-w-40 truncate" title={String(row.ad_id)}>{String(row.ad_id)}</td>
                                                                <td className="px-5 py-3 text-right font-medium text-gray-900">{fmtNum(events)}</td>
                                                                <td className="px-5 py-3 text-right font-bold text-amber-600">{distinct}</td>
                                                                <td className="px-5 py-3 text-right text-gray-700">{fmtUsd(row.revenue_spread)}</td>
                                                                <td className="px-5 py-3 text-right text-gray-700">{fmtUsd(row.avg_revenue)}</td>
                                                                <td className="px-5 py-3 text-right font-medium text-gray-900">{fmtUsd(row.total_revenue)}</td>
                                                                <td className="px-5 py-3 text-right text-gray-700">{rewPct.toFixed(0)}%</td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* All clean state */}
                                {highEcpmUsers.length === 0 && suspiciousConsistency.length === 0 && (
                                    <div className="p-8 text-center">
                                        <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                                            <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <p className="text-sm font-semibold text-gray-700">Revenue Patterns Look Clean</p>
                                        <p className="text-xs text-gray-500 mt-1">No users with abnormal eCPM or suspicious revenue consistency detected.</p>
                                    </div>
                                )}

                                {/* Footer */}
                                <div className="px-5 py-3 text-xs text-gray-500">
                                    Analyzed {fmtNum(revenuePatterns.length)} users • Global eCPM: {fmtUsd(globalAvgEcpm)} • Threshold: {fmtUsd(ecpmThreshold)} (3×)
                                </div>
                            </div>
                        )}
                    </div>
                );
            })()}

            {/* ═══ DEVICE FINGERPRINT CLUSTERING ═══ */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="p-5 sm:p-6 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <h3 className="text-sm font-bold text-gray-900">Device Fingerprint Clustering</h3>
                        {deviceFingerprints.length > 0 && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                                {deviceFingerprints.length} CLUSTER{deviceFingerprints.length !== 1 ? "S" : ""}
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Multiple ad_ids from the same device fingerprint (model + Android version + screen resolution) — indicates factory-reset fraud
                    </p>
                </div>
                {loading ? (
                    <div className="p-6"><div className="h-16 bg-gray-50 rounded-xl animate-pulse" /></div>
                ) : deviceFingerprints.length === 0 ? (
                    <div className="p-8 text-center">
                        <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                            <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <p className="text-sm font-semibold text-gray-700">No Multi-Identity Devices Found</p>
                        <p className="text-xs text-gray-500 mt-1">All device fingerprints map to a single ad_id in this period.</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b border-gray-100 text-left">
                                        <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider">Risk</th>
                                        <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider">Device Model</th>
                                        <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider">Android</th>
                                        <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider">Screen</th>
                                        <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider text-right">Identities</th>
                                        <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider text-right">Sessions</th>
                                        <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider">Ad IDs</th>
                                        <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider">First Seen</th>
                                        <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider">Last Seen</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {deviceFingerprints.map((row, i) => {
                                        const ids = Number(row.unique_ad_ids ?? 0);
                                        const adIds = Array.isArray(row.ad_ids) ? row.ad_ids.map(String) : [];
                                        return (
                                            <tr key={i} className={`hover:bg-gray-50/80 transition-colors ${ids >= 5 ? "bg-red-50/30" : ids >= 3 ? "bg-orange-50/20" : ""}`}>
                                                <td className="px-5 py-3">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                                        ids >= 5 ? "bg-red-50 text-red-700 border-red-200" :
                                                        ids >= 3 ? "bg-orange-50 text-orange-700 border-orange-200" :
                                                        "bg-amber-50 text-amber-700 border-amber-200"
                                                    }`}>
                                                        {ids >= 5 ? "CRITICAL" : ids >= 3 ? "HIGH" : "SUSPECT"}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3 font-medium text-gray-800">{String(row.device_model ?? "—")}</td>
                                                <td className="px-5 py-3 text-gray-700">{String(row.android_version ?? "—")}</td>
                                                <td className="px-5 py-3 text-gray-700 font-mono text-[10px]">{String(row.screen_resolution ?? "—")}</td>
                                                <td className="px-5 py-3 text-right font-bold text-red-600">{ids}</td>
                                                <td className="px-5 py-3 text-right text-gray-700">{fmtNum(row.sessions)}</td>
                                                <td className="px-5 py-3 font-mono text-gray-600 max-w-52 truncate" title={adIds.join(", ")}>
                                                    {adIds.length > 2 ? `${adIds[0]}, +${adIds.length - 1} more` : adIds.join(", ")}
                                                </td>
                                                <td className="px-5 py-3 text-gray-600 whitespace-nowrap">{fmtTime(row.first_seen)}</td>
                                                <td className="px-5 py-3 text-gray-600 whitespace-nowrap">{fmtTime(row.last_seen)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-500">
                            {deviceFingerprints.length} device{deviceFingerprints.length !== 1 ? "s" : ""} with multiple identities •
                            Total identities: {deviceFingerprints.reduce((s, r) => s + Number(r.unique_ad_ids ?? 0), 0)}
                        </div>
                    </>
                )}
            </div>

            {/* ═══ TIME-OF-DAY HEATMAP ═══ */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="p-5 sm:p-6 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3 className="text-sm font-bold text-gray-900">Time-of-Day Activity Heatmap</h3>
                        {nightOwlUsers.length > 0 && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
                                {nightOwlUsers.length} NIGHT OWL{nightOwlUsers.length !== 1 ? "S" : ""}
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Bots run 24/7 while real users sleep. Flags users with &gt;30% ad events between 00:00-06:00 UTC
                    </p>
                </div>
                {loading ? (
                    <div className="p-6"><div className="h-16 bg-gray-50 rounded-xl animate-pulse" /></div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {/* Hourly heatmap bar chart */}
                        {hourlyHeatmap.length > 0 && (() => {
                            const maxEvents = Math.max(...hourlyHeatmap.map((r) => Number(r.event_count ?? 0)), 1);
                            const hours = Array.from({ length: 24 }, (_, i) => {
                                const row = hourlyHeatmap.find((r) => Number(r.hour) === i);
                                return { hour: i, events: Number(row?.event_count ?? 0), users: Number(row?.unique_users ?? 0), revenue: Number(row?.total_revenue ?? 0) };
                            });
                            return (
                                <div className="p-5 sm:p-6">
                                    <div className="flex items-end gap-1 h-32 mb-2">
                                        {hours.map((h) => {
                                            const pct = (h.events / maxEvents) * 100;
                                            const isNight = h.hour >= 0 && h.hour < 6;
                                            return (
                                                <div key={h.hour} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[9px] px-2 py-1 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                                        {h.hour}:00 • {h.events} events • {h.users} users
                                                    </div>
                                                    <div
                                                        className={`w-full rounded-t transition-all ${isNight ? "bg-blue-400" : "bg-indigo-400"} ${h.events === 0 ? "bg-gray-200" : ""}`}
                                                        style={{ height: `${Math.max(pct, 2)}%` }}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="flex justify-between text-[9px] text-gray-400 px-0.5">
                                        <span>00</span><span>03</span><span>06</span><span>09</span><span>12</span><span>15</span><span>18</span><span>21</span><span>23</span>
                                    </div>
                                    <div className="flex items-center gap-4 mt-3">
                                        <span className="flex items-center gap-1 text-[10px] text-gray-500"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block" /> Night (00-06 UTC)</span>
                                        <span className="flex items-center gap-1 text-[10px] text-gray-500"><span className="w-2 h-2 rounded-full bg-indigo-400 inline-block" /> Day (06-24 UTC)</span>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Night owl users table */}
                        {nightOwlUsers.length > 0 ? (
                            <div>
                                <div className="px-5 pt-5 sm:px-6 sm:pt-6">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                                        <h4 className="text-xs font-bold text-gray-800">Suspicious Night Activity Users</h4>
                                    </div>
                                    <p className="text-[10px] text-gray-500 mb-3">Users with &gt;30% of ad events during 00:00-06:00 UTC (3+ events minimum)</p>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs">
                                        <thead>
                                            <tr className="border-b border-gray-100 text-left">
                                                <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider">Risk</th>
                                                <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider">Ad ID</th>
                                                <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider text-right">Night Events</th>
                                                <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider text-right">Total Events</th>
                                                <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider text-right">Night %</th>
                                                <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider text-right">Total Revenue</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {nightOwlUsers.map((row) => {
                                                const nightPct = Number(row.night_pct ?? 0);
                                                return (
                                                    <tr key={String(row.ad_id)} className={`hover:bg-gray-50/80 transition-colors ${nightPct >= 80 ? "bg-blue-50/30" : ""}`}>
                                                        <td className="px-5 py-3">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                                                nightPct >= 80 ? "bg-red-50 text-red-700 border-red-200" :
                                                                nightPct >= 60 ? "bg-orange-50 text-orange-700 border-orange-200" :
                                                                "bg-blue-50 text-blue-700 border-blue-200"
                                                            }`}>
                                                                {nightPct >= 80 ? "BOT LIKELY" : nightPct >= 60 ? "SUSPICIOUS" : "UNUSUAL"}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-3 font-mono text-gray-800 max-w-40 truncate">{String(row.ad_id)}</td>
                                                        <td className="px-5 py-3 text-right font-bold text-blue-600">{fmtNum(row.night_events)}</td>
                                                        <td className="px-5 py-3 text-right text-gray-700">{fmtNum(row.total_events)}</td>
                                                        <td className="px-5 py-3 text-right font-bold text-blue-700">{nightPct.toFixed(1)}%</td>
                                                        <td className="px-5 py-3 text-right text-gray-700">{fmtUsd(row.total_revenue)}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : hourlyHeatmap.length > 0 ? (
                            <div className="p-6 text-center">
                                <p className="text-sm font-semibold text-emerald-700">No suspicious night-owl users detected</p>
                                <p className="text-xs text-gray-500 mt-1">All users show normal activity patterns in this period.</p>
                            </div>
                        ) : (
                            <div className="p-8 text-center">
                                <p className="text-sm font-semibold text-gray-700">No hourly data available</p>
                                <p className="text-xs text-gray-500 mt-1">No ad events found in this period.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ═══ COIN-TO-WITHDRAWAL VELOCITY ═══ */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="p-5 sm:p-6 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <h3 className="text-sm font-bold text-gray-900">Coin-to-Withdrawal Velocity</h3>
                        {(() => {
                            const fast = withdrawalVelocity.filter((r) => Number(r.days_to_withdrawal ?? 999) < 2);
                            return fast.length > 0 ? (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-700 border border-teal-200">
                                    {fast.length} FAST WITHDRAWAL{fast.length !== 1 ? "S" : ""}
                                </span>
                            ) : null;
                        })()}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Flags users who withdrew unusually fast after their first session — legitimate users take days/weeks, fraud bots rush
                    </p>
                </div>
                {loading ? (
                    <div className="p-6"><div className="h-16 bg-gray-50 rounded-xl animate-pulse" /></div>
                ) : withdrawalVelocity.length === 0 ? (
                    <div className="p-8 text-center">
                        <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                        </div>
                        <p className="text-sm font-semibold text-gray-700">No withdrawal data</p>
                        <p className="text-xs text-gray-500 mt-1">No withdrawal requests found in this period.</p>
                    </div>
                ) : (() => {
                    const sorted = [...withdrawalVelocity].sort((a, b) => Number(a.hours_to_withdrawal ?? 0) - Number(b.hours_to_withdrawal ?? 0));
                    const medianDays = sorted.length > 0 ? Number(sorted[Math.floor(sorted.length / 2)]?.days_to_withdrawal ?? 0) : 0;
                    return (
                        <>
                            <div className="p-5 sm:p-6">
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                                    <div className="bg-teal-50 rounded-xl p-4 text-center">
                                        <p className="text-[10px] font-semibold text-teal-500 uppercase tracking-widest mb-0.5">Users with Withdrawals</p>
                                        <p className="text-2xl font-bold text-teal-700">{fmtNum(sorted.length)}</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-4 text-center">
                                        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-0.5">Median Time</p>
                                        <p className="text-2xl font-bold text-gray-900">{medianDays < 1 ? `${(medianDays * 24).toFixed(1)}h` : `${medianDays.toFixed(1)}d`}</p>
                                    </div>
                                    <div className={`rounded-xl p-4 text-center ${sorted.some((r) => Number(r.days_to_withdrawal ?? 999) < 2) ? "bg-red-50" : "bg-emerald-50"}`}>
                                        <p className={`text-[10px] font-semibold uppercase tracking-widest mb-0.5 ${sorted.some((r) => Number(r.days_to_withdrawal ?? 999) < 2) ? "text-red-500" : "text-emerald-500"}`}>
                                            Fast (&lt;2 days)
                                        </p>
                                        <p className={`text-2xl font-bold ${sorted.some((r) => Number(r.days_to_withdrawal ?? 999) < 2) ? "text-red-700" : "text-emerald-700"}`}>
                                            {sorted.filter((r) => Number(r.days_to_withdrawal ?? 999) < 2).length}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="overflow-x-auto border-t border-gray-100">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="border-b border-gray-100 text-left">
                                            <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider">Speed</th>
                                            <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider">Ad ID</th>
                                            <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider text-right">Time to Withdraw</th>
                                            <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider text-right">Withdrawals</th>
                                            <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider text-right">Sessions</th>
                                            <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider">First Activity</th>
                                            <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider">First Withdrawal</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {sorted.map((row) => {
                                            const days = Number(row.days_to_withdrawal ?? 0);
                                            const hours = Number(row.hours_to_withdrawal ?? 0);
                                            return (
                                                <tr key={String(row.ad_id)} className={`hover:bg-gray-50/80 transition-colors ${days < 1 ? "bg-red-50/30" : days < 2 ? "bg-orange-50/20" : ""}`}>
                                                    <td className="px-5 py-3">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                                            days < 1 ? "bg-red-50 text-red-700 border-red-200" :
                                                            days < 2 ? "bg-orange-50 text-orange-700 border-orange-200" :
                                                            days < 7 ? "bg-amber-50 text-amber-700 border-amber-200" :
                                                            "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                        }`}>
                                                            {days < 1 ? "RUSH" : days < 2 ? "FAST" : days < 7 ? "NORMAL" : "SLOW"}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-3 font-mono text-gray-800 max-w-40 truncate">{String(row.ad_id)}</td>
                                                    <td className="px-5 py-3 text-right font-bold text-gray-900">
                                                        {hours < 24 ? `${hours.toFixed(1)}h` : `${days.toFixed(1)}d`}
                                                    </td>
                                                    <td className="px-5 py-3 text-right text-gray-700">{fmtNum(row.withdrawal_count)}</td>
                                                    <td className="px-5 py-3 text-right text-gray-700">{fmtNum(row.total_sessions)}</td>
                                                    <td className="px-5 py-3 text-gray-600 whitespace-nowrap">{fmtTime(row.first_activity)}</td>
                                                    <td className="px-5 py-3 text-gray-600 whitespace-nowrap">{fmtTime(row.first_withdrawal)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    );
                })()}
            </div>

            {/* ═══ PLAY INTEGRITY VERDICT TRACKING ═══ */}
            {(() => {
                const summary = integritySummary[0] ?? {};
                const total = Number(summary.total ?? 0);
                const passed = Number(summary.passed ?? 0);
                const failed = Number(summary.failed ?? 0);
                const missing = Number(summary.missing ?? 0);
                const passRate = total > 0 ? (passed / total) * 100 : 0;
                const failRate = total > 0 ? (failed / total) * 100 : 0;
                const missingRate = total > 0 ? (missing / total) * 100 : 0;

                // Users that NEVER pass integrity
                const neverPassUsers = integrityByUser.filter((r) => Number(r.pass_rate ?? 0) === 0 && Number(r.total_sessions ?? 0) >= 2);

                return (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                        <div className="p-5 sm:p-6 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                                <h3 className="text-sm font-bold text-gray-900">Play Integrity Verdict Tracking</h3>
                                {neverPassUsers.length > 0 && (
                                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                                        {neverPassUsers.length} NEVER PASS
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Session-level Play Integrity token validation — users who never pass are likely on emulators or rooted devices
                            </p>
                        </div>

                        {loading ? (
                            <div className="p-6"><div className="h-16 bg-gray-50 rounded-xl animate-pulse" /></div>
                        ) : total === 0 ? (
                            <div className="p-8 text-center">
                                <p className="text-sm font-semibold text-gray-700">No session data available</p>
                                <p className="text-xs text-gray-500 mt-1">No session_start events found in this period.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {/* Summary cards + integrity bar */}
                                <div className="p-5 sm:p-6">
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                                        <div className="bg-gray-50 rounded-xl p-4 text-center">
                                            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-0.5">Total Sessions</p>
                                            <p className="text-2xl font-bold text-gray-900">{fmtNum(total)}</p>
                                        </div>
                                        <div className="bg-emerald-50 rounded-xl p-4 text-center">
                                            <p className="text-[10px] font-semibold text-emerald-500 uppercase tracking-widest mb-0.5">Passed</p>
                                            <p className="text-2xl font-bold text-emerald-700">{fmtNum(passed)}</p>
                                            <p className="text-[10px] text-emerald-600 mt-0.5">{passRate.toFixed(1)}%</p>
                                        </div>
                                        <div className={`rounded-xl p-4 text-center ${failed > 0 ? "bg-red-50" : "bg-gray-50"}`}>
                                            <p className={`text-[10px] font-semibold uppercase tracking-widest mb-0.5 ${failed > 0 ? "text-red-500" : "text-gray-500"}`}>Failed</p>
                                            <p className={`text-2xl font-bold ${failed > 0 ? "text-red-700" : "text-gray-400"}`}>{fmtNum(failed)}</p>
                                            <p className={`text-[10px] mt-0.5 ${failed > 0 ? "text-red-600" : "text-gray-400"}`}>{failRate.toFixed(1)}%</p>
                                        </div>
                                        <div className={`rounded-xl p-4 text-center ${missing > 0 ? "bg-amber-50" : "bg-gray-50"}`}>
                                            <p className={`text-[10px] font-semibold uppercase tracking-widest mb-0.5 ${missing > 0 ? "text-amber-500" : "text-gray-500"}`}>Missing</p>
                                            <p className={`text-2xl font-bold ${missing > 0 ? "text-amber-700" : "text-gray-400"}`}>{fmtNum(missing)}</p>
                                            <p className={`text-[10px] mt-0.5 ${missing > 0 ? "text-amber-600" : "text-gray-400"}`}>{missingRate.toFixed(1)}%</p>
                                        </div>
                                    </div>

                                    {/* Integrity bar */}
                                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex">
                                        {passed > 0 && <div className="bg-emerald-500 h-full" style={{ width: `${passRate}%` }} />}
                                        {failed > 0 && <div className="bg-red-500 h-full" style={{ width: `${failRate}%` }} />}
                                        {missing > 0 && <div className="bg-amber-400 h-full" style={{ width: `${missingRate}%` }} />}
                                    </div>
                                    <div className="flex items-center gap-4 mt-2">
                                        <span className="flex items-center gap-1 text-[10px] text-gray-500"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Passed</span>
                                        <span className="flex items-center gap-1 text-[10px] text-gray-500"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Failed</span>
                                        <span className="flex items-center gap-1 text-[10px] text-gray-500"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Missing</span>
                                    </div>
                                </div>

                                {/* Never-pass users table */}
                                {neverPassUsers.length > 0 ? (
                                    <div>
                                        <div className="px-5 pt-5 sm:px-6 sm:pt-6">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="w-2 h-2 rounded-full bg-red-500" />
                                                <h4 className="text-xs font-bold text-gray-800">Users That Never Pass Integrity</h4>
                                            </div>
                                            <p className="text-[10px] text-gray-500 mb-3">Users with 0% pass rate across 2+ sessions — likely emulators, rooted devices, or modded apps</p>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-xs">
                                                <thead>
                                                    <tr className="border-b border-gray-100 text-left">
                                                        <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                                        <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider">Ad ID</th>
                                                        <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider text-right">Sessions</th>
                                                        <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider text-right">Failed</th>
                                                        <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider text-right">Missing</th>
                                                        <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider">Verdicts</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50">
                                                    {neverPassUsers.map((row) => {
                                                        const verdicts = Array.isArray(row.verdicts) ? row.verdicts.map(String).filter(Boolean) : [];
                                                        return (
                                                            <tr key={String(row.ad_id)} className="hover:bg-gray-50/80 transition-colors bg-red-50/20">
                                                                <td className="px-5 py-3">
                                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                                                                        NEVER PASSES
                                                                    </span>
                                                                </td>
                                                                <td className="px-5 py-3 font-mono text-gray-800 max-w-40 truncate">{String(row.ad_id)}</td>
                                                                <td className="px-5 py-3 text-right text-gray-700">{fmtNum(row.total_sessions)}</td>
                                                                <td className="px-5 py-3 text-right font-bold text-red-600">{fmtNum(row.failed)}</td>
                                                                <td className="px-5 py-3 text-right text-amber-600">{fmtNum(row.missing)}</td>
                                                                <td className="px-5 py-3 text-gray-600">
                                                                    {verdicts.length > 0 ? verdicts.join(", ") : "—"}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-6 text-center">
                                        <p className="text-sm font-semibold text-emerald-700">All users have passed integrity at least once</p>
                                        <p className="text-xs text-gray-500 mt-1">No emulator/rooted device patterns detected.</p>
                                    </div>
                                )}

                                <div className="px-5 py-3 text-xs text-gray-500">
                                    {fmtNum(integrityByUser.length)} users analyzed • {neverPassUsers.length} never-pass user{neverPassUsers.length !== 1 ? "s" : ""}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })()}

            {/* Search bar for both tables */}
            <div className="flex justify-end">
                <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Filter by ad_id…"
                        value={searchAdId}
                        onChange={(e) => setSearchAdId(e.target.value)}
                        className="pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 w-64"
                    />
                </div>
            </div>

            {/* Per-User Revenue Comparison (cross-join) */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="p-5 sm:p-6 border-b border-gray-100">
                    <h3 className="text-sm font-bold text-gray-900">Per-User Revenue Comparison</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Joined by ad_id — Server (keepplay-logs) vs Game (game-side-reports) — sorted by risk
                    </p>
                </div>

                {loading ? (
                    <div className="p-8 text-center">
                        <div className="inline-flex items-center gap-2 text-sm text-gray-500">
                            <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Scanning for fraud…
                        </div>
                    </div>
                ) : filteredRows.length === 0 ? (
                    <div className="p-8 text-center">
                        <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                            <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <p className="text-sm font-semibold text-gray-700">No suspicious activity found</p>
                        <p className="text-xs text-gray-500 mt-1">
                            {searchAdId ? "No users match your search." : "No ad events recorded in this period."}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b border-gray-100 text-left">
                                    <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider">Risk</th>
                                    <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider">Ad ID</th>
                                    <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider text-right">Server Rev</th>
                                    <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider text-right">Game Rev</th>
                                    <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider text-right">Δ Diff</th>
                                    <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider text-right">Server Events</th>
                                    <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider text-right">Game Events</th>
                                    <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider text-right">Integrity Fails</th>
                                    <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider text-right">High Freq Hours</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredRows.map((row) => (
                                    <tr key={row.key} className={`hover:bg-gray-50/80 transition-colors ${
                                        row.risk === "critical" ? "bg-red-50/30" :
                                        row.risk === "high" ? "bg-orange-50/30" :
                                        ""
                                    }`}>
                                        <td className="px-5 py-3">{getRiskBadge(row.risk)}</td>
                                        <td className="px-5 py-3 font-mono text-gray-800 max-w-44 truncate" title={row.adId}>
                                            {row.adId}
                                        </td>
                                        <td className="px-5 py-3 text-right font-medium text-gray-900">{fmtUsd(row.srvRev)}</td>
                                        <td className="px-5 py-3 text-right font-medium text-gray-900">{fmtUsd(row.gmeRev)}</td>
                                        <td className={`px-5 py-3 text-right font-bold ${
                                            Math.abs(row.diffPct) > 20 ? "text-red-600" :
                                            Math.abs(row.diffPct) > 10 ? "text-amber-600" :
                                            "text-gray-600"
                                        }`}>
                                            {row.diffPct >= 0 ? "+" : ""}{row.diffPct.toFixed(1)}%
                                        </td>
                                        <td className="px-5 py-3 text-right text-gray-700">{fmtNum(row.srvEvents)}</td>
                                        <td className="px-5 py-3 text-right text-gray-700">{fmtNum(row.gmeEvents)}</td>
                                        <td className={`px-5 py-3 text-right font-medium ${row.intFails > 0 ? "text-red-600" : "text-gray-500"}`}>
                                            {fmtNum(row.intFails)}
                                        </td>
                                        <td className={`px-5 py-3 text-right font-medium ${row.freqHours > 0 ? "text-orange-600" : "text-gray-500"}`}>
                                            {fmtNum(row.freqHours)}
                                            {row.maxEventsInHour > 0 && (
                                                <span className="text-gray-400 ml-1">(max {row.maxEventsInHour}/h)</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {!loading && filteredRows.length > 0 && (
                    <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-500">
                        Showing {filteredRows.length} user{filteredRows.length !== 1 ? "s" : ""} •{" "}
                        {filteredRows.filter((r) => r.risk === "critical" || r.risk === "high").length} flagged
                    </div>
                )}
            </div>

            {/* Raw data: Side-by-side Server vs Game per ad_id */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Server-Side Revenue (keepplay-logs) */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <div className="p-5 sm:p-6 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-indigo-500" />
                            <h3 className="text-sm font-bold text-gray-900">Server-Side Revenue</h3>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                            keepplay-logs — ad_event type, grouped by ad_id
                        </p>
                    </div>
                    {loading ? (
                        <div className="p-8 text-center text-sm text-gray-500">Loading…</div>
                    ) : filteredServerRows.length === 0 ? (
                        <div className="p-8 text-center text-xs text-gray-500">No server-side ad events in this period.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b border-gray-100 text-left">
                                        <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider">Ad ID</th>
                                        <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider text-right">Events</th>
                                        <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider text-right">Revenue</th>
                                        <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider text-right">Coins</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredServerRows.map((row, i) => (
                                        <tr key={i} className="hover:bg-gray-50/80 transition-colors">
                                            <td className="px-5 py-3 font-mono text-gray-800 max-w-44 truncate" title={String(row.ad_id ?? "")}>
                                                {String(row.ad_id ?? "—")}
                                            </td>
                                            <td className="px-5 py-3 text-right text-gray-700">{fmtNum(row.server_events)}</td>
                                            <td className="px-5 py-3 text-right font-medium text-gray-900">{fmtUsd(row.server_revenue)}</td>
                                            <td className="px-5 py-3 text-right text-gray-700">{fmtNum(row.server_coins)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {!loading && filteredServerRows.length > 0 && (
                        <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-500">
                            {filteredServerRows.length} ad_id{filteredServerRows.length !== 1 ? "s" : ""}
                        </div>
                    )}
                </div>

                {/* Game-Side Revenue (game-side-reports) */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <div className="p-5 sm:p-6 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-emerald-500" />
                            <h3 className="text-sm font-bold text-gray-900">Game-Side Revenue</h3>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                            game-side-reports — grouped by ad_id
                        </p>
                    </div>
                    {loading ? (
                        <div className="p-8 text-center text-sm text-gray-500">Loading…</div>
                    ) : filteredGameRows.length === 0 ? (
                        <div className="p-8 text-center text-xs text-gray-500">No game-side ad reports in this period.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b border-gray-100 text-left">
                                        <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider">Ad ID</th>
                                        <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider text-right">Events</th>
                                        <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider text-right">Revenue (USD)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredGameRows.map((row, i) => (
                                        <tr key={i} className="hover:bg-gray-50/80 transition-colors">
                                            <td className="px-5 py-3 font-mono text-gray-800 max-w-44 truncate" title={String(row.ad_id ?? "")}>
                                                {String(row.ad_id ?? "—")}
                                            </td>
                                            <td className="px-5 py-3 text-right text-gray-700">{fmtNum(row.game_events)}</td>
                                            <td className="px-5 py-3 text-right font-medium text-gray-900">{fmtUsd(row.game_revenue)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {!loading && filteredGameRows.length > 0 && (
                        <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-500">
                            {filteredGameRows.length} ad_id{filteredGameRows.length !== 1 ? "s" : ""}
                        </div>
                    )}
                </div>
            </div>

            {/* Integrity Failures Detail */}
            {integrityFailures.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <div className="p-5 sm:p-6 border-b border-gray-100">
                        <h3 className="text-sm font-bold text-gray-900">Integrity Verification Failures</h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Ad events that failed cryptographic integrity checks
                        </p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b border-gray-100 text-left">
                                    <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider">Ad ID</th>
                                    <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider">Verdict</th>
                                    <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider text-right">Failed Events</th>
                                    <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider text-right">Revenue at Risk</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {integrityFailures.map((row, i) => (
                                    <tr key={i} className="hover:bg-gray-50/80 transition-colors">
                                        <td className="px-5 py-3 font-mono text-gray-800 max-w-50 truncate" title={String(row.ad_id)}>
                                            {String(row.ad_id ?? "—")}
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                                                {String(row.integrity_verdict ?? "UNKNOWN")}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-right font-bold text-red-600">{fmtNum(row.failed_events)}</td>
                                        <td className="px-5 py-3 text-right font-medium text-gray-900">{fmtUsd(row.total_revenue)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* High Frequency Users */}
            {highFrequency.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <div className="p-5 sm:p-6 border-b border-gray-100">
                        <h3 className="text-sm font-bold text-gray-900">High-Frequency Ad Users</h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Users with &gt;120 ad events in a single hour — potential bot activity
                        </p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b border-gray-100 text-left">
                                    <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider">Ad ID</th>
                                    <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider text-right">Suspicious Hours</th>
                                    <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider text-right">Max Events/Hour</th>
                                    <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider text-right">Avg Events/Hour</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {highFrequency.map((row, i) => (
                                    <tr key={i} className="hover:bg-gray-50/80 transition-colors">
                                        <td className="px-5 py-3 font-mono text-gray-800 max-w-50 truncate" title={String(row.ad_id)}>
                                            {String(row.ad_id ?? "—")}
                                        </td>
                                        <td className="px-5 py-3 text-right font-bold text-orange-600">{fmtNum(row.suspicious_hours)}</td>
                                        <td className="px-5 py-3 text-right font-bold text-red-600">{fmtNum(row.max_events_in_hour)}</td>
                                        <td className="px-5 py-3 text-right text-gray-700">{fmtNum(row.avg_events_per_hour)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Recent Suspicious Events Feed */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="p-5 sm:p-6 border-b border-gray-100">
                    <h3 className="text-sm font-bold text-gray-900">Recent Suspicious Events</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Last 50 ad events that failed integrity — from keepplay-logs
                    </p>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-sm text-gray-500">Loading…</div>
                ) : recentSuspicious.length === 0 ? (
                    <div className="p-8 text-center">
                        <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                            <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <p className="text-sm font-semibold text-gray-700">No integrity failures</p>
                        <p className="text-xs text-gray-500 mt-1">All ad events passed verification in this period.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b border-gray-100 text-left">
                                    <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider">Time</th>
                                    <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider">Ad ID</th>
                                    <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider">Ad Type</th>
                                    <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider text-right">Revenue</th>
                                    <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider text-right">Coins</th>
                                    <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider">Verdict</th>
                                    <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider">Source</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {recentSuspicious.map((row, i) => (
                                    <tr key={i} className="hover:bg-red-50/30 transition-colors">
                                        <td className="px-5 py-3 text-gray-600 whitespace-nowrap">{fmtTime(row._time)}</td>
                                        <td className="px-5 py-3 font-mono text-gray-800 max-w-40 truncate" title={String(row.ad_id)}>
                                            {String(row.ad_id ?? "—")}
                                        </td>
                                        <td className="px-5 py-3 text-gray-700">{String(row.ad_type ?? "—")}</td>
                                        <td className="px-5 py-3 text-right font-medium text-gray-900">{fmtUsd(row.revenue)}</td>
                                        <td className="px-5 py-3 text-right text-gray-700">{fmtNum(row.coins_earned)}</td>
                                        <td className="px-5 py-3">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                                                {String(row.integrity_verdict ?? "FAIL")}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-gray-600">{String(row.source ?? "—")}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── Danger Zone ── */}
            <div className="bg-white rounded-2xl border-2 border-red-200 shadow-sm">
                <div className="p-5 sm:p-6 border-b border-red-200 bg-red-50/50 rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-red-900">Danger Zone</h3>
                            <p className="text-xs text-red-700 mt-0.5">
                                Permanently delete all data from Axiom datasets. This action <strong>cannot be undone</strong>.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-5 sm:p-6 space-y-4">
                    {/* Result banner */}
                    {trimResult && (
                        <div className={`rounded-xl p-4 text-sm font-medium ${
                            trimResult.success
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : "bg-red-50 text-red-800 border border-red-200"
                        }`}>
                            {trimResult.success ? "✓ " : "✗ "}{trimResult.message}
                        </div>
                    )}

                    {/* Dataset purge cards */}
                    {([
                        { id: "keepplay-logs", label: "keepplay-logs", desc: "All server-side events (ad events, sessions, errors, security logs)" },
                        { id: "game-side-reports", label: "game-side-reports", desc: "Game SDK ad revenue reports" },
                    ] as const).map((ds) => (
                        <div key={ds.id} className="flex items-center justify-between gap-4 p-4 bg-gray-50 rounded-xl">
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-gray-900 font-mono">{ds.label}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{ds.desc}</p>
                            </div>
                            {trimConfirm === ds.id ? (
                                <div className="flex items-center gap-2 shrink-0">
                                    <div className="flex flex-col gap-1.5">
                                        <p className="text-[10px] text-red-600 font-semibold uppercase tracking-wider">
                                            Type &quot;{ds.id}&quot; to confirm
                                        </p>
                                        <input
                                            type="text"
                                            value={trimTyped}
                                            onChange={(e) => setTrimTyped(e.target.value)}
                                            placeholder={ds.id}
                                            className="px-3 py-1.5 text-xs border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/30 w-48 font-mono"
                                            autoFocus
                                        />
                                    </div>
                                    <button
                                        onClick={() => handleTrim(ds.id)}
                                        disabled={trimTyped !== ds.id || trimLoading}
                                        className="px-4 py-2 text-xs font-bold bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                    >
                                        {trimLoading ? "Purging…" : "Confirm Delete"}
                                    </button>
                                    <button
                                        onClick={() => { setTrimConfirm(null); setTrimTyped(""); }}
                                        className="px-3 py-2 text-xs font-semibold text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300 transition-all"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => { setTrimConfirm(ds.id); setTrimTyped(""); setTrimResult(null); }}
                                    className="shrink-0 px-4 py-2 text-xs font-bold text-red-700 bg-red-100 border border-red-200 rounded-lg hover:bg-red-200 transition-all"
                                >
                                    Delete All Data
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
