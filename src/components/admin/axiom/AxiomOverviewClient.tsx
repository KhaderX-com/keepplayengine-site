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

/** Parse Axiom tabular response into row objects */
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
                    <p className="text-3xl font-bold text-gray-900 tracking-tight leading-none">
                        {value}
                    </p>
                    {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
                </>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────
// Severity badge
// ─────────────────────────────────────────────

function SeverityBadge({ severity }: { severity: string }) {
    const styles: Record<string, string> = {
        info: "bg-blue-50 text-blue-700",
        warn: "bg-yellow-50 text-yellow-700",
        error: "bg-red-50 text-red-700",
        critical: "bg-red-100 text-red-900 font-bold",
    };
    return (
        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${styles[severity] || "bg-gray-50 text-gray-600"}`}>
            {severity}
        </span>
    );
}

// ─────────────────────────────────────────────
// Type badge color
// ─────────────────────────────────────────────

function typeBadgeColor(type: string): string {
    if (type === "ad_event") return "bg-emerald-50 text-emerald-700";
    if (type === "session_start") return "bg-blue-50 text-blue-700";
    if (type.startsWith("auth_")) return "bg-purple-50 text-purple-700";
    if (type.startsWith("challenge_") || type === "challenges_viewed") return "bg-amber-50 text-amber-700";
    if (type.startsWith("withdrawal_")) return "bg-indigo-50 text-indigo-700";
    if (type.startsWith("security_") || type === "error") return "bg-red-50 text-red-700";
    if (type === "fcm_token_updated") return "bg-cyan-50 text-cyan-700";
    return "bg-gray-50 text-gray-600";
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────

export default function AxiomOverviewClient() {
    const [timeRange, setTimeRange] = useState<TimeRange>("24h");
    const [loading, setLoading] = useState(true);

    // Data states
    const [eventsByType, setEventsByType] = useState<Record<string, unknown>[]>([]);
    const [sessionData, setSessionData] = useState<Record<string, unknown>[]>([]);
    const [adSummary, setAdSummary] = useState<Record<string, unknown>[]>([]);
    const [errorsSummary, setErrorsSummary] = useState<Record<string, unknown>[]>([]);
    const [topCountries, setTopCountries] = useState<Record<string, unknown>[]>([]);
    const [gameSideReports, setGameSideReports] = useState<Record<string, unknown>[]>([]);
    const [recentEvents, setRecentEvents] = useState<Record<string, unknown>[]>([]);
    const [eventsOverTime, setEventsOverTime] = useState<Record<string, unknown>[]>([]);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        const { startTime, endTime } = getTimeRange(timeRange);

        try {
            const results = await Promise.allSettled([
                fetchAxiom("events-by-type", startTime, endTime),
                fetchAxiom("session-count", startTime, endTime),
                fetchAxiom("ad-events-summary", startTime, endTime),
                fetchAxiom("errors-summary", startTime, endTime),
                fetchAxiom("top-countries", startTime, endTime),
                fetchAxiom("game-side-reports", startTime, endTime),
                fetchAxiom("recent-events", startTime, endTime),
                fetchAxiom("events-over-time", startTime, endTime),
            ]);

            const extract = (r: PromiseSettledResult<AxiomResponse>) =>
                r.status === "fulfilled" && r.value.success ? parseTabular(r.value.data?.tables) : [];

            setEventsByType(extract(results[0]));
            setSessionData(extract(results[1]));
            setAdSummary(extract(results[2]));
            setErrorsSummary(extract(results[3]));
            setTopCountries(extract(results[4]));
            setGameSideReports(extract(results[5]));
            setRecentEvents(extract(results[6]));
            setEventsOverTime(extract(results[7]));
        } catch (err) {
            console.error("Failed to fetch Axiom data:", err);
        } finally {
            setLoading(false);
        }
    }, [timeRange]);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    // ── Computed values ──
    const totalEvents = eventsByType.reduce((sum, r) => sum + (Number(r.count) || 0), 0);
    const uniqueUsers = sessionData.length > 0 ? Number(sessionData[0].unique_users) || 0 : 0;
    const totalSessions = sessionData.length > 0 ? Number(sessionData[0].sessions) || 0 : 0;
    const totalAdEvents = adSummary.length > 0 ? Number(adSummary[0].total_events) || 0 : 0;
    const totalRevenue = adSummary.length > 0 ? Number(adSummary[0].total_revenue) || 0 : 0;
    const totalCoins = adSummary.length > 0 ? Number(adSummary[0].total_coins) || 0 : 0;
    const totalErrors = errorsSummary.reduce((sum, r) => sum + (Number(r.count) || 0), 0);

    const timeRangeOptions: { label: string; value: TimeRange }[] = [
        { label: "1h", value: "1h" },
        { label: "6h", value: "6h" },
        { label: "24h", value: "24h" },
        { label: "7d", value: "7d" },
        { label: "30d", value: "30d" },
    ];

    return (
        <div className="space-y-6">
            {/* Time range selector + refresh */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 bg-white rounded-xl border border-gray-200 p-1">
                    {timeRangeOptions.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => setTimeRange(opt.value)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                timeRange === opt.value
                                    ? "bg-black text-white"
                                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
                <button
                    onClick={fetchAll}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                    <svg
                        className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                    </svg>
                    Refresh
                </button>
            </div>

            {/* Top stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Total Events"
                    value={totalEvents.toLocaleString()}
                    sub={`across ${eventsByType.length} types`}
                    color="bg-blue-500"
                    loading={loading}
                />
                <StatCard
                    label="Unique Users (DAU)"
                    value={uniqueUsers.toLocaleString()}
                    sub={`${totalSessions.toLocaleString()} sessions`}
                    color="bg-emerald-500"
                    loading={loading}
                />
                <StatCard
                    label="Ad Events"
                    value={totalAdEvents.toLocaleString()}
                    sub={`$${totalRevenue.toFixed(4)} revenue`}
                    color="bg-amber-500"
                    loading={loading}
                />
                <StatCard
                    label="Errors / Security"
                    value={totalErrors.toLocaleString()}
                    sub={`${errorsSummary.length} types`}
                    color={totalErrors > 0 ? "bg-red-500" : "bg-gray-300"}
                    loading={loading}
                />
            </div>

            {/* Second row — Coins + Revenue detail */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard
                    label="Coins Earned"
                    value={totalCoins.toLocaleString()}
                    sub={`$${(totalCoins / 100000).toFixed(2)} USD value`}
                    color="bg-yellow-500"
                    loading={loading}
                />
                <StatCard
                    label="Avg Revenue / Ad"
                    value={
                        adSummary.length > 0
                            ? `$${(Number(adSummary[0].avg_revenue) || 0).toFixed(5)}`
                            : "$0"
                    }
                    color="bg-indigo-500"
                    loading={loading}
                />
                <StatCard
                    label="Game-Side Reports"
                    value={gameSideReports.reduce((s, r) => s + (Number(r.total_reports) || 0), 0).toLocaleString()}
                    sub={`${gameSideReports.length} game(s)`}
                    color="bg-purple-500"
                    loading={loading}
                />
            </div>

            {/* Events by Type + Top Countries */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Events by Type */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
                    <h3 className="text-sm font-bold text-gray-900 mb-4">Events by Type</h3>
                    {loading ? (
                        <div className="space-y-2">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="h-8 bg-gray-50 rounded-lg animate-pulse" />
                            ))}
                        </div>
                    ) : eventsByType.length === 0 ? (
                        <p className="text-sm text-gray-400">No events in this time range</p>
                    ) : (
                        <div className="space-y-2">
                            {eventsByType.map((row, i) => {
                                const count = Number(row.count) || 0;
                                const pct = totalEvents > 0 ? (count / totalEvents) * 100 : 0;
                                return (
                                    <div key={i} className="flex items-center gap-3">
                                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold shrink-0 ${typeBadgeColor(String(row.type))}`}>
                                            {String(row.type)}
                                        </span>
                                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gray-900 rounded-full transition-all"
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                        <span className="text-sm font-semibold text-gray-700 tabular-nums w-16 text-right">
                                            {count.toLocaleString()}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Top Countries */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
                    <h3 className="text-sm font-bold text-gray-900 mb-4">Top Countries (Sessions)</h3>
                    {loading ? (
                        <div className="space-y-2">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="h-8 bg-gray-50 rounded-lg animate-pulse" />
                            ))}
                        </div>
                    ) : topCountries.length === 0 ? (
                        <p className="text-sm text-gray-400">No session data in this time range</p>
                    ) : (
                        <div className="space-y-2">
                            {topCountries.map((row, i) => {
                                const sessions = Number(row.sessions) || 0;
                                const maxSessions = Number(topCountries[0]?.sessions) || 1;
                                const pct = (sessions / maxSessions) * 100;
                                return (
                                    <div key={i} className="flex items-center gap-3">
                                        <span className="text-sm font-medium text-gray-700 w-20 truncate">
                                            {String(row.country) || "Unknown"}
                                        </span>
                                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-blue-500 rounded-full transition-all"
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                        <span className="text-sm font-semibold text-gray-700 tabular-nums w-16 text-right">
                                            {sessions.toLocaleString()}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Events Over Time (simple bar-style) */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
                <h3 className="text-sm font-bold text-gray-900 mb-4">Events Over Time</h3>
                {loading ? (
                    <div className="h-32 bg-gray-50 rounded-lg animate-pulse" />
                ) : eventsOverTime.length === 0 ? (
                    <p className="text-sm text-gray-400">No event data in this time range</p>
                ) : (
                    <div className="flex items-end gap-0.5 h-32">
                        {eventsOverTime.map((row, i) => {
                            const count = Number(row.count) || 0;
                            const max = Math.max(...eventsOverTime.map((r) => Number(r.count) || 0), 1);
                            const heightPct = (count / max) * 100;
                            const time = row._time ? new Date(String(row._time)) : null;
                            return (
                                <div
                                    key={i}
                                    className="flex-1 bg-gray-900 rounded-t-sm hover:bg-blue-600 transition-colors cursor-default group relative"
                                    style={{ height: `${Math.max(heightPct, 2)}%` }}
                                    title={`${time ? time.toLocaleString() : "?"}: ${count.toLocaleString()} events`}
                                />
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Game-Side Reports */}
            {gameSideReports.length > 0 && !loading && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
                    <h3 className="text-sm font-bold text-gray-900 mb-4">Game-Side Reports (by Game)</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="text-left py-2 px-3 text-gray-500 font-semibold text-xs uppercase">Game ID</th>
                                    <th className="text-right py-2 px-3 text-gray-500 font-semibold text-xs uppercase">Reports</th>
                                    <th className="text-right py-2 px-3 text-gray-500 font-semibold text-xs uppercase">Revenue</th>
                                </tr>
                            </thead>
                            <tbody>
                                {gameSideReports.map((row, i) => (
                                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                                        <td className="py-2.5 px-3 font-medium text-gray-900">{String(row.game_id)}</td>
                                        <td className="py-2.5 px-3 text-right tabular-nums">{(Number(row.total_reports) || 0).toLocaleString()}</td>
                                        <td className="py-2.5 px-3 text-right tabular-nums">${(Number(row.total_revenue) || 0).toFixed(4)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Errors & Security */}
            {errorsSummary.length > 0 && !loading && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
                    <h3 className="text-sm font-bold text-gray-900 mb-4">Errors & Security Events</h3>
                    <div className="space-y-2">
                        {errorsSummary.map((row, i) => (
                            <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg bg-red-50/50">
                                <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${typeBadgeColor(String(row.type))}`}>
                                    {String(row.type)}
                                </span>
                                <span className="text-sm font-bold text-red-700 tabular-nums">
                                    {(Number(row.count) || 0).toLocaleString()}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent Events Feed */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
                <h3 className="text-sm font-bold text-gray-900 mb-4">Recent Events</h3>
                {loading ? (
                    <div className="space-y-2">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="h-10 bg-gray-50 rounded-lg animate-pulse" />
                        ))}
                    </div>
                ) : recentEvents.length === 0 ? (
                    <p className="text-sm text-gray-400">No recent events</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="text-left py-2 px-3 text-gray-500 font-semibold text-xs uppercase">Time</th>
                                    <th className="text-left py-2 px-3 text-gray-500 font-semibold text-xs uppercase">Type</th>
                                    <th className="text-left py-2 px-3 text-gray-500 font-semibold text-xs uppercase">Severity</th>
                                    <th className="text-left py-2 px-3 text-gray-500 font-semibold text-xs uppercase">User</th>
                                    <th className="text-left py-2 px-3 text-gray-500 font-semibold text-xs uppercase">Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentEvents.map((row, i) => {
                                    const time = row._time ? new Date(String(row._time)) : null;
                                    const details: string[] = [];
                                    if (row.game_id) details.push(`game: ${row.game_id}`);
                                    if (row.revenue) details.push(`rev: $${Number(row.revenue).toFixed(5)}`);
                                    if (row.coins_earned) details.push(`+${row.coins_earned} coins`);
                                    if (row.country) details.push(String(row.country));
                                    if (row.error_message) details.push(String(row.error_message));

                                    return (
                                        <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                                            <td className="py-2 px-3 text-gray-500 tabular-nums whitespace-nowrap text-xs">
                                                {time ? time.toLocaleTimeString() : "—"}
                                            </td>
                                            <td className="py-2 px-3">
                                                <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${typeBadgeColor(String(row.type))}`}>
                                                    {String(row.type)}
                                                </span>
                                            </td>
                                            <td className="py-2 px-3">
                                                <SeverityBadge severity={String(row.severity || "info")} />
                                            </td>
                                            <td className="py-2 px-3 text-gray-600 text-xs font-mono truncate max-w-30">
                                                {row.user_id ? String(row.user_id).slice(0, 8) + "…" : "—"}
                                            </td>
                                            <td className="py-2 px-3 text-gray-500 text-xs truncate max-w-50">
                                                {details.join(" · ") || "—"}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
