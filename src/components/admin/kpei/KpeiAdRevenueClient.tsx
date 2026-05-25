"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    DollarSign,
    Coins,
    TrendingUp,
    Users,
    Wallet,
    Gamepad2,
    RefreshCw,
    AlertTriangle,
    ArrowDownToLine,
    Clock,
    Globe,
    Activity,
    CalendarDays,
    Check,
    Info,
    XCircle,
} from "lucide-react";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface EconomyData {
    wallets: { totalCoins: number; userCount: number; avgBalance: number } | null;
    challenges: { totalCoinsEarned: number; totalBonusCoins: number; totalChallenges: number; claimedCount: number } | null;
    withdrawals: { totalPaidCoins: number; totalPaidUsd: number; paidCount: number; totalPendingCoins: number; pendingCount: number; totalRequests: number } | null;
}

interface AxiomTable {
    fields: Array<{ name: string; type: string }>;
    columns: Array<Array<unknown>>;
}

interface AxiomData {
    adSummary: AxiomTable | null;
    sessions: AxiomTable | null;
    eventsOverTime: AxiomTable | null;
    topCountries: AxiomTable | null;
}

interface ApiResponse {
    success: boolean;
    economy: EconomyData;
    axiom: AxiomData;
    timeRange: { startTime: string; endTime: string };
}

type DateTimeRange = {
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const COIN_TO_USD = 0.00001;
const toUsd = (coins: number) => {
    const usd = coins * COIN_TO_USD;
    if (usd < 0.01 && usd > 0) return `$${usd.toFixed(5)}`;
    return `$${usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/** Parse an Axiom tabular table into row objects */
function parseAxiomTable(table: AxiomTable | null): Record<string, unknown>[] {
    if (!table?.fields?.length || !table.columns?.length) return [];
    const names = table.fields.map((f) => f.name);
    const rowCount = table.columns[0]?.length ?? 0;
    const rows: Record<string, unknown>[] = [];
    for (let r = 0; r < rowCount; r++) {
        const row: Record<string, unknown> = {};
        for (let c = 0; c < names.length; c++) {
            row[names[c]] = table.columns[c]?.[r] ?? null;
        }
        rows.push(row);
    }
    return rows;
}

function pad2(n: number) {
    return String(n).padStart(2, "0");
}

function localDateValue(d: Date) {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function localTimeValue(d: Date) {
    return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function defaultRange(): DateTimeRange {
    const end = new Date();
    const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 0, 0);
    return {
        startDate: localDateValue(start),
        startTime: localTimeValue(start),
        endDate: localDateValue(end),
        endTime: localTimeValue(end),
    };
}

function presetRange(preset: "today" | "yesterday" | "7d" | "30d"): DateTimeRange {
    const end = new Date();
    const start = new Date(end);

    if (preset === "today") {
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 0, 0);
    } else if (preset === "yesterday") {
        start.setDate(start.getDate() - 1);
        end.setDate(end.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 0, 0);
    } else {
        start.setDate(start.getDate() - (preset === "7d" ? 6 : 29));
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 0, 0);
    }

    return {
        startDate: localDateValue(start),
        startTime: localTimeValue(start),
        endDate: localDateValue(end),
        endTime: localTimeValue(end),
    };
}

function rangeDateTime(date: string, time: string) {
    if (!date) return null;
    const [hours = "0", minutes = "0"] = (time || "00:00").split(":");
    const d = new Date(date);
    d.setHours(Number(hours), Number(minutes), 0, 0);
    return Number.isNaN(d.getTime()) ? null : d;
}

function rangeToQuery(range: DateTimeRange) {
    return {
        start: rangeDateTime(range.startDate, range.startTime)?.toISOString(),
        end: rangeDateTime(range.endDate, range.endTime)?.toISOString(),
    };
}

function sameRange(a: DateTimeRange, b: DateTimeRange) {
    return a.startDate === b.startDate
        && a.startTime === b.startTime
        && a.endDate === b.endDate
        && a.endTime === b.endTime;
}

function timezoneLabel() {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const offset = new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "shortOffset",
    })
        .formatToParts(new Date())
        .find((part) => part.type === "timeZoneName")?.value;

    return `${zone}${offset ? ` (${offset})` : ""}`;
}

function fmtLocal(date: string, time: string) {
    const d = rangeDateTime(date, time);
    if (!d) return "Not set";
    return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(d);
}

function fmtUtc(date: string, time: string) {
    const d = rangeDateTime(date, time);
    if (!d) return "Not set";
    return d.toISOString().replace(".000Z", "Z");
}

function DateTimeToolbar({
    draftRange,
    appliedRange,
    loading,
    onDraftChange,
    onApply,
    onClear,
    onRefresh,
}: {
    draftRange: DateTimeRange;
    appliedRange: DateTimeRange;
    loading: boolean;
    onDraftChange: (range: DateTimeRange) => void;
    onApply: () => void;
    onClear: () => void;
    onRefresh: () => void;
}) {
    const start = rangeDateTime(draftRange.startDate, draftRange.startTime);
    const end = rangeDateTime(draftRange.endDate, draftRange.endTime);
    const invalid = Boolean(start && end && start > end);
    const dirty = !sameRange(draftRange, appliedRange);
    const update = (field: keyof DateTimeRange, value: string) => onDraftChange({ ...draftRange, [field]: value });

    return (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="grid gap-4 p-4">
                <div className="flex flex-col gap-3 2xl:flex-row 2xl:items-start 2xl:justify-between">
                    <div className="min-w-0 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="inline-flex h-10 items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-4 text-xs font-semibold text-gray-800">
                                <CalendarDays className="h-4 w-4 shrink-0 text-emerald-500" />
                                <span>Choose date & time</span>
                            </div>
                            <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-700">
                                Europe/Brussels
                            </span>
                        </div>

                        <div className="grid gap-3 lg:grid-cols-[minmax(280px,1fr)_auto_minmax(280px,1fr)] lg:items-center">
                            <div className="rounded-2xl border border-gray-200 bg-white p-2 shadow-[0_1px_8px_rgba(15,23,42,0.04)]">
                                <div className="mb-1 px-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">From</div>
                                <div className="grid grid-cols-[1fr_auto_104px] items-center gap-2">
                                    <input
                                        type="date"
                                        value={draftRange.startDate}
                                        onChange={(e) => update("startDate", e.target.value)}
                                        className="h-9 min-w-0 rounded-full bg-gray-50 px-3 text-sm font-semibold text-gray-900 outline-none ring-1 ring-gray-100 transition focus:bg-white focus:ring-gray-300"
                                    />
                                    <span className="h-7 w-px bg-gray-200" />
                                    <input
                                        type="time"
                                        step="60"
                                        value={draftRange.startTime}
                                        onChange={(e) => update("startTime", e.target.value)}
                                        className="h-9 rounded-full bg-gray-50 px-3 text-sm font-semibold text-gray-900 outline-none ring-1 ring-gray-100 transition focus:bg-white focus:ring-gray-300"
                                    />
                                </div>
                            </div>

                            <div className="hidden h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-[11px] font-bold uppercase text-gray-400 lg:flex">
                                to
                            </div>

                            <div className="rounded-2xl border border-gray-200 bg-white p-2 shadow-[0_1px_8px_rgba(15,23,42,0.04)]">
                                <div className="mb-1 px-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">To</div>
                                <div className="grid grid-cols-[1fr_auto_104px] items-center gap-2">
                                    <input
                                        type="date"
                                        value={draftRange.endDate}
                                        onChange={(e) => update("endDate", e.target.value)}
                                        className="h-9 min-w-0 rounded-full bg-gray-50 px-3 text-sm font-semibold text-gray-900 outline-none ring-1 ring-gray-100 transition focus:bg-white focus:ring-gray-300"
                                    />
                                    <span className="h-7 w-px bg-gray-200" />
                                    <input
                                        type="time"
                                        step="60"
                                        value={draftRange.endTime}
                                        onChange={(e) => update("endTime", e.target.value)}
                                        className="h-9 rounded-full bg-gray-50 px-3 text-sm font-semibold text-gray-900 outline-none ring-1 ring-gray-100 transition focus:bg-white focus:ring-gray-300"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 2xl:items-end">
                        <div className="flex flex-wrap items-center gap-2 2xl:justify-end">
                            {[
                                ["today", "Today"],
                                ["yesterday", "Yesterday"],
                                ["7d", "7 days"],
                                ["30d", "30 days"],
                            ].map(([key, label]) => (
                                <button key={key} type="button" onClick={() => onDraftChange(presetRange(key as "today" | "yesterday" | "7d" | "30d"))} className="h-9 rounded-full border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-600 transition hover:bg-gray-50">
                                    {label}
                                </button>
                            ))}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 2xl:justify-end">
                            <button type="button" onClick={onApply} disabled={loading || invalid} className="inline-flex h-10 items-center gap-2 rounded-full bg-black px-5 text-xs font-bold text-white transition hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-50">
                                <Check className="h-4 w-4 shrink-0" />
                                Apply
                            </button>
                            <button type="button" onClick={onClear} disabled={loading} className="inline-flex h-10 items-center gap-2 rounded-full border border-gray-200 bg-white px-4 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50">
                                <XCircle className="h-4 w-4 shrink-0" />
                                Reset
                            </button>
                            <button type="button" onClick={onRefresh} disabled={loading} className="inline-flex h-10 items-center gap-2 rounded-full border border-gray-200 bg-white px-4 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50">
                                <RefreshCw className={`h-4 w-4 shrink-0 ${loading ? "animate-spin" : ""}`} />
                                Refresh
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid gap-3 border-t border-gray-100 pt-4 lg:grid-cols-[minmax(260px,0.75fr)_minmax(420px,1.25fr)]">
                    <div className="flex items-start gap-3 rounded-2xl bg-gray-50 px-4 py-3">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                            <Info className="h-4 w-4" />
                        </div>
                        <p className="text-xs leading-5 text-gray-600">
                            Local dashboard time is <span className="font-semibold text-gray-900">{timezoneLabel()}</span>.
                            Axiom compares the selected range in UTC after Apply.
                        </p>
                    </div>

                    <div className="grid gap-2 rounded-2xl bg-gray-50 p-3 sm:grid-cols-2">
                        <div className="rounded-xl bg-white px-3 py-2 ring-1 ring-gray-100">
                            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">From UTC</p>
                            <p className="break-all font-mono text-[11px] font-semibold text-gray-800">{fmtUtc(draftRange.startDate, draftRange.startTime)}</p>
                            <p className="mt-1 text-[11px] text-gray-500">{fmtLocal(draftRange.startDate, draftRange.startTime)}</p>
                        </div>
                        <div className="rounded-xl bg-white px-3 py-2 ring-1 ring-gray-100">
                            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">To UTC</p>
                            <p className="break-all font-mono text-[11px] font-semibold text-gray-800">{fmtUtc(draftRange.endDate, draftRange.endTime)}</p>
                            <p className="mt-1 text-[11px] text-gray-500">{fmtLocal(draftRange.endDate, draftRange.endTime)}</p>
                        </div>
                    </div>

                    {(dirty || invalid) && (
                        <p className={`lg:col-span-2 rounded-xl px-3 py-2 text-[11px] font-semibold ${invalid ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700"}`}>
                            {invalid ? "The start date/time must be before the end date/time." : "You have unapplied changes. Data will update only after Apply is clicked."}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// Stat Card
// ─────────────────────────────────────────────

function StatCard({
    icon,
    label,
    value,
    sub,
    accent = "blue",
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    sub?: string;
    accent?: "blue" | "amber" | "green" | "purple" | "red" | "indigo";
}) {
    const accents: Record<string, { bg: string; icon: string }> = {
        blue:   { bg: "bg-blue-50",    icon: "text-blue-500"    },
        amber:  { bg: "bg-amber-50",   icon: "text-amber-500"   },
        green:  { bg: "bg-emerald-50", icon: "text-emerald-500" },
        purple: { bg: "bg-purple-50",  icon: "text-purple-500"  },
        red:    { bg: "bg-red-50",     icon: "text-red-500"     },
        indigo: { bg: "bg-indigo-50",  icon: "text-indigo-500"  },
    };
    const a = accents[accent] ?? accents.blue;

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
                <div className={`w-8 h-8 rounded-xl ${a.bg} flex items-center justify-center ${a.icon}`}>
                    {icon}
                </div>
                <p className="text-xs font-medium text-gray-500 leading-tight">{label}</p>
            </div>
            <p className="text-xl font-bold text-gray-900 font-mono">{value}</p>
            {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
        </div>
    );
}

// ─────────────────────────────────────────────
// Mini bar for top-countries list
// ─────────────────────────────────────────────

function MiniBar({ pct }: { pct: number }) {
    return (
        <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div className="bg-blue-400 h-1.5 rounded-full transition-all" style={{ width: `${Math.max(2, pct)}%` }} />
        </div>
    );
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export default function KpeiAdRevenueClient() {
    const [data, setData] = useState<ApiResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Time range controls
    const [draftRange, setDraftRange] = useState<DateTimeRange>(() => defaultRange());
    const [appliedRange, setAppliedRange] = useState<DateTimeRange>(() => defaultRange());

    const fetchData = useCallback(async (range: DateTimeRange) => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            const queryRange = rangeToQuery(range);
            if (queryRange.start) params.set("startTime", queryRange.start);
            if (queryRange.end) params.set("endTime", queryRange.end);
            const res = await fetch(`/api/kpei/ad-revenue?${params.toString()}`);
            if (!res.ok) throw new Error(`Failed: ${res.status}`);
            const json: ApiResponse = await res.json();
            if (!json.success) throw new Error("Failed to load data");
            setData(json);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(appliedRange); }, [fetchData, appliedRange]);

    const applyRange = () => {
        setAppliedRange(draftRange);
    };

    const resetRange = () => {
        const nextRange = defaultRange();
        setDraftRange(nextRange);
        setAppliedRange(nextRange);
    };

    // ── Initial Loading ──
    if (loading && !data) {
        return (
            <div className="max-w-6xl mx-auto space-y-5">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 space-y-2">
                            <Skeleton className="h-4 w-20 rounded-xl" />
                            <Skeleton className="h-7 w-28 rounded-xl" />
                        </div>
                    ))}
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 rounded-xl" />)}
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="max-w-6xl mx-auto">
                <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-700">
                    <AlertTriangle className="w-5 h-5 mb-2" />
                    <p className="font-medium">{error ?? "Failed to load"}</p>
                    <Button variant="outline" size="sm" onClick={() => fetchData(appliedRange)} className="mt-3 rounded-xl">
                        Retry
                    </Button>
                </div>
            </div>
        );
    }

    const { economy, axiom } = data;
    const { wallets, challenges, withdrawals } = economy;

    // Parse Axiom tables
    const adRows = parseAxiomTable(axiom.adSummary);
    const adSummary = adRows[0] ?? {};
    const sessionRows = parseAxiomTable(axiom.sessions);
    const sessions = sessionRows[0] ?? {};
    const countryRows = parseAxiomTable(axiom.topCountries);
    const eventsRows = parseAxiomTable(axiom.eventsOverTime);

    // Derived values
    const axiomAdEvents = Number(adSummary.total_events ?? 0);
    const axiomAdRevenue = Number(adSummary.total_revenue ?? 0);
    const axiomAvgRevenue = Number(adSummary.avg_revenue ?? 0);
    const axiomAdCoins = Number(adSummary.total_coins ?? 0);
    const axiomSessions = Number(sessions.sessions ?? 0);
    const axiomUniqueUsers = Number(sessions.unique_users ?? 0);

    const maxCountrySessions = countryRows.length > 0
        ? Math.max(...countryRows.map((r) => Number(r.sessions ?? 0)))
        : 1;

    // Events-over-time sparkline data
    const sparkValues = eventsRows.map((r) => Number(r.count ?? 0));
    const sparkMax = Math.max(1, ...sparkValues);

    return (
        <div className="max-w-6xl mx-auto space-y-5">
            {/* ── Time Range Filter ── */}
            <DateTimeToolbar
                draftRange={draftRange}
                appliedRange={appliedRange}
                loading={loading}
                onDraftChange={setDraftRange}
                onApply={applyRange}
                onClear={resetRange}
                onRefresh={() => fetchData(appliedRange)}
            />

            {/* ── Section: Axiom Ad Revenue ── */}
            <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5" /> Ad Revenue (Axiom Logs)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    <StatCard
                        icon={<DollarSign className="w-4 h-4" />}
                        label="Ad Revenue"
                        value={`$${axiomAdRevenue.toFixed(4)}`}
                        sub={`Avg $${axiomAvgRevenue.toFixed(6)}/event`}
                        accent="green"
                    />
                    <StatCard
                        icon={<TrendingUp className="w-4 h-4" />}
                        label="Ad Events"
                        value={axiomAdEvents.toLocaleString()}
                        sub={`${axiomAdCoins.toLocaleString()} coins`}
                        accent="blue"
                    />
                    <StatCard
                        icon={<Users className="w-4 h-4" />}
                        label="Sessions"
                        value={axiomSessions.toLocaleString()}
                        sub={`${axiomUniqueUsers.toLocaleString()} unique users`}
                        accent="indigo"
                    />
                    {/* Sparkline card */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 col-span-2 sm:col-span-2">
                        <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1.5">
                            <Activity className="w-3.5 h-3.5 text-blue-400" /> Events Over Time
                        </p>
                        {sparkValues.length > 0 ? (
                            <div className="flex items-end gap-px h-12">
                                {sparkValues.map((v, i) => (
                                    <div
                                        key={i}
                                        className="flex-1 bg-blue-400 rounded-t-sm min-w-0.5 transition-all"
                                        style={{ height: `${Math.max(4, (v / sparkMax) * 100)}%` }}
                                        title={`${v} events`}
                                    />
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-gray-400">No event data</p>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Section: On-Chain Economy (Supabase) ── */}
            <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Coins className="w-3.5 h-3.5" /> Coin Economy (Supabase)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    <StatCard
                        icon={<Wallet className="w-4 h-4" />}
                        label="Coins in Circulation"
                        value={wallets ? wallets.totalCoins.toLocaleString() : "—"}
                        sub={wallets ? `${toUsd(wallets.totalCoins)} · ${wallets.userCount} wallets` : undefined}
                        accent="amber"
                    />
                    <StatCard
                        icon={<Coins className="w-4 h-4" />}
                        label="Avg Wallet Balance"
                        value={wallets ? Math.round(wallets.avgBalance).toLocaleString() : "—"}
                        sub={wallets ? toUsd(wallets.avgBalance) : undefined}
                        accent="amber"
                    />
                    <StatCard
                        icon={<Gamepad2 className="w-4 h-4" />}
                        label="Challenge Coins Earned"
                        value={challenges ? challenges.totalCoinsEarned.toLocaleString() : "—"}
                        sub={challenges ? `${challenges.totalBonusCoins.toLocaleString()} bonus · ${challenges.claimedCount}/${challenges.totalChallenges} claimed` : undefined}
                        accent="purple"
                    />
                    <StatCard
                        icon={<ArrowDownToLine className="w-4 h-4" />}
                        label="Total Withdrawn"
                        value={withdrawals ? `$${withdrawals.totalPaidUsd.toFixed(2)}` : "—"}
                        sub={withdrawals ? `${withdrawals.totalPaidCoins.toLocaleString()} coins · ${withdrawals.paidCount} payouts` : undefined}
                        accent="green"
                    />
                </div>
            </div>

            {/* ── Pending Withdrawals Banner ── */}
            {withdrawals && withdrawals.pendingCount > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-amber-500" />
                        <div>
                            <p className="text-sm font-semibold text-amber-800">
                                {withdrawals.pendingCount} pending withdrawal{withdrawals.pendingCount > 1 ? "s" : ""}
                            </p>
                            <p className="text-xs text-amber-600">
                                {withdrawals.totalPendingCoins.toLocaleString()} coins ({toUsd(withdrawals.totalPendingCoins)})
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl border-amber-300 text-amber-700 hover:bg-amber-100"
                        onClick={() => window.location.href = "/admin/kpe/withdrawals/pending"}
                    >
                        Review
                    </Button>
                </div>
            )}

            {/* ── Bottom Grid: Top Countries + Economy Breakdown ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Top Countries */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-3 border-b border-gray-100">
                        <h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                            <Globe className="w-4 h-4 text-blue-500" /> Top Countries
                        </h3>
                    </div>
                    {countryRows.length > 0 ? (
                        <div className="divide-y divide-gray-50">
                            {countryRows.slice(0, 8).map((row, i) => {
                                const country = String(row.country ?? "Unknown");
                                const count = Number(row.sessions ?? 0);
                                return (
                                    <div key={i} className="px-5 py-2.5 flex items-center gap-3">
                                        <span className="text-xs font-bold text-gray-400 w-4">{i + 1}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-800 truncate">{country}</p>
                                            <MiniBar pct={(count / maxCountrySessions) * 100} />
                                        </div>
                                        <span className="text-sm font-mono font-semibold text-gray-700">{count.toLocaleString()}</span>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="py-8 text-center text-gray-400">
                            <Globe className="w-6 h-6 mx-auto mb-2 opacity-30" />
                            <p className="text-sm">No country data</p>
                        </div>
                    )}
                </div>

                {/* Economy Flow Breakdown */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-3 border-b border-gray-100">
                        <h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-green-500" /> Economy Flow
                        </h3>
                    </div>
                    <div className="p-5 space-y-4">
                        <FlowRow
                            label="Ad Revenue (Axiom)"
                            value={`$${axiomAdRevenue.toFixed(4)}`}
                            sub={`${axiomAdEvents.toLocaleString()} events`}
                            color="bg-green-400"
                        />
                        <FlowRow
                            label="Coins Distributed"
                            value={wallets ? wallets.totalCoins.toLocaleString() : "—"}
                            sub={wallets ? toUsd(wallets.totalCoins) : ""}
                            color="bg-amber-400"
                        />
                        <FlowRow
                            label="Challenge Earnings"
                            value={challenges ? challenges.totalCoinsEarned.toLocaleString() : "—"}
                            sub={challenges ? `+${challenges.totalBonusCoins.toLocaleString()} bonus` : ""}
                            color="bg-purple-400"
                        />
                        <FlowRow
                            label="Withdrawals (Paid)"
                            value={withdrawals ? `$${withdrawals.totalPaidUsd.toFixed(2)}` : "—"}
                            sub={withdrawals ? `${withdrawals.paidCount} payouts` : ""}
                            color="bg-blue-400"
                        />
                        <FlowRow
                            label="Pending Payouts"
                            value={withdrawals ? withdrawals.totalPendingCoins.toLocaleString() : "—"}
                            sub={withdrawals ? `${withdrawals.pendingCount} requests` : ""}
                            color="bg-red-400"
                        />

                        {/* Net position */}
                        <div className="pt-3 border-t border-gray-100">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-gray-500">
                                    Net: Ad Revenue − Paid Withdrawals
                                </span>
                                <span className="text-sm font-bold font-mono text-gray-900">
                                    ${(axiomAdRevenue - (withdrawals?.totalPaidUsd ?? 0)).toFixed(4)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// Flow Row helper
// ─────────────────────────────────────────────

function FlowRow({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
    return (
        <div className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full ${color} shrink-0`} />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700">{label}</p>
            </div>
            <div className="text-right shrink-0">
                <p className="text-sm font-bold font-mono text-gray-900">{value}</p>
                {sub && <p className="text-[11px] text-gray-400">{sub}</p>}
            </div>
        </div>
    );
}
