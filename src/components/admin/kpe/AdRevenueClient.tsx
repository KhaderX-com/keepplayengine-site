"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { Skeleton } from "@/components/ui/skeleton";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    DollarSign,
    TrendingUp,
    Users,
    BarChart3,
    RefreshCw,
    Calendar,
    AlertTriangle,
    XCircle,
    Tv,
    Gift,
    Gamepad2,
    Activity,
} from "lucide-react";

// ─────────────────────────────────────────────
// Types (match new RPC return shapes)
// ─────────────────────────────────────────────

interface Summary {
    total_revenue: number;
    total_events: number;
    unique_users: number;
    days_active: number;
    avg_revenue_per_event: number;
    from_date: string;
    to_date: string;
}

interface DailyRow {
    day: string;
    events: number;
    revenue: number;
    users: number;
    ad_types: number;
    apps: number;
}

interface TypeRow {
    ad_type: string;
    events: number;
    revenue: number;
    users: number;
}

interface AppRow {
    app_key_id: string;
    app_name: string;
    events: number;
    revenue: number;
    users: number;
}

interface TypePerAppRow {
    app_key_id: string;
    app_name: string;
    ad_type: string;
    events: number;
    revenue: number;
    users: number;
}

interface GameConfig {
    app_key_name: string;
    title: string;
    game_icon_url: string | null;
}

interface ChartRow {
    day: string;
    ad_type: string;
    events: number;
    revenue: number;
    users: number;
}

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const AD_TYPE_ICON: Record<string, React.ReactNode> = {
    rewarded: <Gift className="w-4 h-4" />,
    interstitial: <Tv className="w-4 h-4" />,
};

const AD_TYPE_COLOR: Record<string, string> = {
    rewarded: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
    interstitial: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
};

const AD_TYPE_BAR_COLOR: Record<string, string> = {
    rewarded: "bg-emerald-500",
    interstitial: "bg-blue-500",
};

const AD_TYPE_STROKE: Record<string, string> = {
    rewarded: "#10b981",     // emerald-500
    interstitial: "#3b82f6", // blue-500
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function fmt$(n: number) {
    return "$" + n.toFixed(4);
}

function fmtInt(n: number) {
    return n.toLocaleString("en-US");
}

function fmtDate(d: string) {
    return new Date(d + "T00:00:00").toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

function fmtDateShort(d: string) {
    return new Date(d + "T00:00:00").toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
    });
}

/** Bar width as % relative to max value in the set */
function barPct(val: number, max: number) {
    if (max <= 0) return 0;
    return Math.max(2, (val / max) * 100);
}

/** Group TypePerApp rows by app_name */
function groupByApp(rows: TypePerAppRow[]) {
    const map = new Map<string, { app_name: string; app_key_id: string; types: TypePerAppRow[] }>();
    for (const r of rows) {
        const key = r.app_key_id;
        if (!map.has(key)) {
            map.set(key, { app_name: r.app_name, app_key_id: r.app_key_id, types: [] });
        }
        map.get(key)!.types.push(r);
    }
    return Array.from(map.values());
}

/** Get unique days from chart data */
function uniqueDays(data: ChartRow[]) {
    return [...new Set(data.map((r) => r.day))].sort();
}

/** Get unique ad types from chart data */
function uniqueAdTypes(data: ChartRow[]) {
    return [...new Set(data.map((r) => r.ad_type))].sort();
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export default function AdRevenueClient() {
    const [summary, setSummary] = useState<Summary | null>(null);
    const [daily, setDaily] = useState<DailyRow[]>([]);
    const [byType, setByType] = useState<TypeRow[]>([]);
    const [byApp, setByApp] = useState<AppRow[]>([]);
    const [typePerApp, setTypePerApp] = useState<TypePerAppRow[]>([]);
    const [chart, setChart] = useState<ChartRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Date range filter
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    // Games config map: app_key_name → GameConfig (for icon + title lookup)
    const [gameInfoMap, setGameInfoMap] = useState<Map<string, GameConfig>>(new Map());

    // Fetch games config once on mount (no date range dependency)
    useEffect(() => {
        fetch("/api/kpe/config/loyalty_games_config")
            .then((r) => r.json())
            .then((data) => {
                const map = new Map<string, GameConfig>();
                for (const row of (data.rows ?? []) as Record<string, unknown>[]) {
                    const key = row.app_key_name ? String(row.app_key_name) : null;
                    if (key) {
                        map.set(key, {
                            app_key_name: key,
                            title: row.title ? String(row.title) : key,
                            game_icon_url: row.game_icon_url ? String(row.game_icon_url) : null,
                        });
                    }
                }
                setGameInfoMap(map);
            })
            .catch(() => {}); // silent fail — header falls back to app_name
    }, []);



    // ── Fetch all views ──────────────────────

    const fetchAll = useCallback(async (from?: string, to?: string) => {
        setLoading(true);
        setError(null);

        const qs = new URLSearchParams();
        if (from) qs.set("from", from);
        if (to) qs.set("to", to);
        const suffix = qs.toString() ? `&${qs.toString()}` : "";

        try {
            const [sumRes, dailyRes, typeRes, appRes, tpaRes, chartRes] =
                await Promise.all([
                    fetch(`/api/kpe/ad-revenue?view=summary${suffix}`),
                    fetch(`/api/kpe/ad-revenue?view=daily${suffix}`),
                    fetch(`/api/kpe/ad-revenue?view=by-type${suffix}`),
                    fetch(`/api/kpe/ad-revenue?view=by-app${suffix}`),
                    fetch(`/api/kpe/ad-revenue?view=type-per-app${suffix}`),
                    fetch(`/api/kpe/ad-revenue?view=chart${suffix}`),
                ]);

            const [sumData, dailyData, typeData, appData, tpaData, chartData] =
                await Promise.all([
                    sumRes.json(),
                    dailyRes.json(),
                    typeRes.json(),
                    appRes.json(),
                    tpaRes.json(),
                    chartRes.json(),
                ]);

            if (!sumRes.ok) throw new Error(sumData.error ?? "Failed to load summary");

            setSummary(sumData.summary ?? null);
            setDaily(dailyData.daily ?? []);
            setByType(typeData.byType ?? []);
            setByApp(appData.byApp ?? []);
            setTypePerApp(tpaData.typePerApp ?? []);
            setChart(chartData.chart ?? []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    const handleFilter = () => {
        fetchAll(fromDate || undefined, toDate || undefined);
    };

    const clearFilter = () => {
        setFromDate("");
        setToDate("");
        fetchAll();
    };

    // ── Render ───────────────────────────────

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Card key={i}>
                            <CardHeader className="pb-2">
                                <Skeleton className="h-4 w-24" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-8 w-32" />
                                <Skeleton className="h-3 w-20 mt-2" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
                <Card>
                    <CardHeader><Skeleton className="h-5 w-40" /></CardHeader>
                    <CardContent className="space-y-3">
                        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
                    </CardContent>
                </Card>
            </div>
        );
    }

    const appGroups = groupByApp(typePerApp);

    // Chart data
    const chartDays = uniqueDays(chart);
    const chartAdTypes = uniqueAdTypes(chart);
    const maxChartRevenue = Math.max(0, ...chart.map((r) => r.revenue));

    return (
        <div className="space-y-6">
            {/* Error */}
            {error && (
                <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                    <p className="text-sm font-medium text-red-800 dark:text-red-300 flex-1">{error}</p>
                    <button onClick={() => setError(null)} className="text-red-600 hover:opacity-80" title="Dismiss error">
                        <XCircle className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Date filter toolbar */}
            <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center divide-x divide-gray-200 rounded-full border border-gray-200 bg-white shadow-sm overflow-hidden">
                    <div className="flex items-center gap-1.5 px-3 py-1.5">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">From</span>
                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            title="From date"
                            className="text-xs text-gray-800 bg-transparent border-0 outline-none w-30 cursor-pointer"
                        />
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">To</span>
                        <input
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            title="To date"
                            className="text-xs text-gray-800 bg-transparent border-0 outline-none w-30 cursor-pointer"
                        />
                    </div>
                </div>
                <button
                    onClick={handleFilter}
                    className="flex items-center gap-1.5 bg-black text-white text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-gray-900 transition-colors"
                >
                    <Calendar className="w-3.5 h-3.5" />
                    Filter
                </button>
                {(fromDate || toDate) && (
                    <button
                        onClick={clearFilter}
                        className="flex items-center gap-1.5 bg-white text-gray-600 text-xs font-medium px-3 py-1.5 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                        <XCircle className="w-3.5 h-3.5" />
                        Clear
                    </button>
                )}
                <button
                    onClick={() => fetchAll(fromDate || undefined, toDate || undefined)}
                    className="flex items-center gap-1.5 bg-white text-gray-600 text-xs font-medium px-3 py-1.5 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Refresh
                </button>
            </div>

            {/* ── Summary Cards ──────────────── */}
            {summary && (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4">
                    <Card className="bg-black border-0 shadow-xl overflow-hidden relative col-span-2 md:col-span-1">
                        {/* subtle radial glow */}
                        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(74,222,128,0.12),transparent_70%)]" />
                        <CardContent className="px-4 pb-4 pt-4 md:px-5 md:pb-5 md:pt-5 flex flex-col gap-3 relative z-10">
                            {/* label row */}
                            <p className="text-[14px] font-(family-name:--font-lilita-one) uppercase text-[#14ff00]">
                                Total Revenue
                            </p>
                            {/* icon + number row */}
                            <div className="flex items-center gap-0.1">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src="https://res.cloudinary.com/destej60y/image/upload/v1774828614/dollar-symbol_2_h0hrku.png"
                                    alt="revenue"
                                    width={42}
                                    height={42}
                                    className="w-9 h-9 md:w-11 md:h-11 object-contain shrink-0 drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]"
                                />
                                <p className="text-4xl md:text-5xl leading-none text-white tracking-tight font-(family-name:--font-lilita-one)">
                                    {fmt$(summary.total_revenue).slice(1)}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-1 md:pb-2 px-3 md:px-6 pt-3 md:pt-6">
                            <CardDescription className="text-xs md:text-sm font-medium">Total Ads</CardDescription>
                            <Activity className="w-4 h-4 md:w-5 md:h-5 text-orange-500 shrink-0" />
                        </CardHeader>
                        <CardContent className="px-3 pb-3 md:px-6 md:pb-6">
                            <p className="text-lg md:text-2xl font-bold text-orange-700 dark:text-orange-400">
                                {fmtInt(summary.total_events)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                ad impressions
                            </p>
                        </CardContent>
                    </Card>

                    

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-1 md:pb-2 px-3 md:px-6 pt-3 md:pt-6">
                            <CardDescription className="text-xs md:text-sm font-medium">eCPM</CardDescription>
                            <Gamepad2 className="w-4 h-4 md:w-5 md:h-5 text-teal-500 shrink-0" />
                        </CardHeader>
                        <CardContent className="px-3 pb-3 md:px-6 md:pb-6">
                            <p className="text-lg md:text-2xl font-bold text-teal-700 dark:text-teal-400">
                                {fmt$(summary.avg_revenue_per_event * 1000)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                revenue per 1,000 ads
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-1 md:pb-2 px-3 md:px-6 pt-3 md:pt-6">
                            <CardDescription className="text-xs md:text-sm font-medium">Avg / Ad</CardDescription>
                            <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-blue-500 shrink-0" />
                        </CardHeader>
                        <CardContent className="px-3 pb-3 md:px-6 md:pb-6">
                            <p className="text-lg md:text-2xl font-bold text-blue-700 dark:text-blue-400">
                                {fmt$(summary.avg_revenue_per_event)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                revenue per ad
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-1 md:pb-2 px-3 md:px-6 pt-3 md:pt-6">
                            <CardDescription className="text-xs md:text-sm font-medium">Unique Users</CardDescription>
                            <Users className="w-4 h-4 md:w-5 md:h-5 text-indigo-500 shrink-0" />
                        </CardHeader>
                        <CardContent className="px-3 pb-3 md:px-6 md:pb-6">
                            <p className="text-lg md:text-2xl font-bold text-indigo-700 dark:text-indigo-400">
                                {fmtInt(summary.unique_users)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                distinct players
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-1 md:pb-2 px-3 md:px-6 pt-3 md:pt-6">
                            <CardDescription className="text-xs md:text-sm font-medium">Days Active</CardDescription>
                            <BarChart3 className="w-4 h-4 md:w-5 md:h-5 text-purple-500 shrink-0" />
                        </CardHeader>
                        <CardContent className="px-3 pb-3 md:px-6 md:pb-6">
                            <p className="text-lg md:text-2xl font-bold text-purple-700 dark:text-purple-400">
                                {summary.days_active}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                {summary.from_date && summary.to_date
                                    ? `${fmtDate(summary.from_date)} — ${fmtDate(summary.to_date)}`
                                    : "no date range"}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* ── Revenue Chart (daily by ad type) ─── */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Revenue Chart
                    </CardTitle>
                    <CardDescription>Daily revenue breakdown by ad type</CardDescription>
                </CardHeader>
                <CardContent>
                    {chart.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-8">No chart data</p>
                    ) : (() => {
                        // Compute Y-axis ticks (4 steps)
                        const ySteps = 4;
                        const yTicks = Array.from({ length: ySteps + 1 }, (_, i) =>
                            maxChartRevenue * (i / ySteps)
                        );
                        // Total revenue per day for the combined summary badge
                        const dayTotals = chartDays.map((day) =>
                            chart.filter((r) => r.day === day).reduce((s, r) => s + r.revenue, 0)
                        );
                        const maxDayTotal = Math.max(0, ...dayTotals);

                        return (
                            <>
                                {/* Legend */}
                                <div className="flex items-center gap-5 mb-5">
                                    {chartAdTypes.map((t) => (
                                        <div key={t} className="flex items-center gap-2 text-xs font-medium">
                                            <span className={`w-3 h-3 rounded-sm ${AD_TYPE_BAR_COLOR[t] ?? "bg-gray-400"}`} />
                                            <span className="capitalize text-gray-700 dark:text-gray-300">{t}</span>
                                        </div>
                                    ))}
                                    <span className="ml-auto text-xs text-gray-400">
                                        {chartDays.length} day{chartDays.length !== 1 ? "s" : ""}
                                    </span>
                                </div>

                                {/* Chart area with Y-axis */}
                                <div className="flex min-w-0">
                                    {/* Y-axis labels */}
                                    <div className="flex flex-col-reverse justify-between h-44 md:h-52 pr-2 py-0.5 shrink-0">
                                        {yTicks.map((tick, i) => (
                                            <span key={i} className="text-[9px] md:text-[10px] text-gray-400 tabular-nums text-right w-10 md:w-14 leading-none">
                                                {tick < 0.01 ? `$${tick.toFixed(4)}` : `$${tick.toFixed(2)}`}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Scrollable chart column — bars + dates scroll together */}
                                    <div className="flex-1 overflow-x-auto min-w-0 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                                        <div className={`relative ${chartDays.length > 7 ? "min-w-max" : "w-full"}`}>
                                            {/* Horizontal grid lines — behind bars only */}
                                            <div className="absolute top-0 left-0 right-0 h-44 md:h-52 flex flex-col-reverse justify-between pointer-events-none">
                                                {yTicks.map((_, i) => (
                                                    <div key={i} className={`border-t ${i === 0 ? "border-gray-300 dark:border-gray-600" : "border-gray-100 dark:border-gray-800"}`} />
                                                ))}
                                            </div>

                                            {/* One column per day: revenue label → bars → date label.
                                                All three live in the same div so they can never mis-align. */}
                                            <TooltipProvider delayDuration={0}>
                                                <div className={`flex items-end w-full ${chartDays.length <= 7 ? "justify-around" : "gap-1"}`}>
                                                    {chartDays.map((day, dayIdx) => {
                                                        const dayRows = chart.filter((r) => r.day === day);
                                                        const dayTotal = dayTotals[dayIdx];
                                                        const barH = (rev: number) => maxDayTotal > 0 ? Math.max(4, (rev / maxDayTotal) * 160) : 4;
                                                        const barW = chartDays.length <= 3 ? "24px" : chartDays.length <= 7 ? "18px" : "12px";

                                                        return (
                                                            <div
                                                                key={day}
                                                                className="flex flex-col items-center px-1"
                                                                style={{ flex: chartDays.length <= 7 ? "0 0 auto" : "1 1 0", minWidth: "44px" }}
                                                            >
                                                                {/* Revenue label */}
                                                                <span className="text-[9px] md:text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1 tabular-nums leading-none text-center">
                                                                    {fmt$(dayTotal)}
                                                                </span>

                                                                {/* Bars — fixed height area */}
                                                                <div className="h-44 md:h-52 flex items-end justify-center gap-0.5">
                                                                    {chartAdTypes.map((adType) => {
                                                                        const row = dayRows.find((r) => r.ad_type === adType);
                                                                        const revenue = row?.revenue ?? 0;
                                                                        return (
                                                                            <Tooltip key={adType}>
                                                                                <TooltipTrigger asChild>
                                                                                    <div
                                                                                        className={`rounded-t-sm cursor-pointer transition-all hover:opacity-75 ${AD_TYPE_BAR_COLOR[adType] ?? "bg-gray-400"}`}
                                                                                        style={{ height: `${barH(revenue)}px`, width: barW }}
                                                                                    />
                                                                                </TooltipTrigger>
                                                                                <TooltipContent side="top" className="text-xs space-y-0.5">
                                                                                    <p className="font-semibold">{fmtDate(day)}</p>
                                                                                    <p className="capitalize">{adType}: {fmt$(revenue)}</p>
                                                                                    <p className="text-gray-400">{fmtInt(row?.events ?? 0)} ads · {fmtInt(row?.users ?? 0)} users</p>
                                                                                </TooltipContent>
                                                                            </Tooltip>
                                                                        );
                                                                    })}
                                                                </div>

                                                                {/* Date label — directly below bars, perfectly centered */}
                                                                <div className="w-full border-t border-gray-200 dark:border-gray-700 pt-1.5 mt-0 text-center">
                                                                    <span className="text-[10px] md:text-[11px] font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                                                        {fmtDateShort(day)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </TooltipProvider>
                                        </div>
                                    </div>
                                </div>
                            </>
                        );
                    })()}
                </CardContent>
            </Card>

            {/* ── Revenue by Ad Type (all games) ──── */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Tv className="w-4 h-4" />
                        Revenue by Ad Type
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {byType.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">No data</p>
                    ) : (
                        <div className="grid grid-cols-2 gap-3 md:gap-4">
                            {byType.map((t) => {
                                const pct = summary ? barPct(t.revenue, summary.total_revenue) : 0;
                                const stroke = AD_TYPE_STROKE[t.ad_type] ?? "#9ca3af";
                                return (
                                    <div key={t.ad_type} className="flex flex-col items-center gap-2 p-3 md:p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/50">
                                        {/* Donut ring */}
                                        <div className="relative w-20 h-20 flex items-center justify-center">
                                            <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90 absolute inset-0">
                                                <circle cx="18" cy="18" r="15.9155" fill="none" strokeWidth="3.2" className="stroke-gray-200 dark:stroke-gray-700" />
                                                <circle
                                                    cx="18" cy="18" r="15.9155" fill="none"
                                                    strokeWidth="3.2"
                                                    strokeLinecap="round"
                                                    strokeDasharray={`${pct.toFixed(1)} ${(100 - pct).toFixed(1)}`}
                                                    style={{ stroke }}
                                                />
                                            </svg>
                                            <span className="relative text-sm font-bold text-gray-800 dark:text-gray-100 tabular-nums">
                                                {Math.round(pct)}%
                                            </span>
                                        </div>
                                        {/* Label */}
                                        <div className="flex items-center gap-1.5">
                                            {AD_TYPE_ICON[t.ad_type] ?? <Tv className="w-4 h-4" />}
                                            <Badge className={AD_TYPE_COLOR[t.ad_type] ?? "bg-gray-100 text-gray-800"}>
                                                {t.ad_type}
                                            </Badge>
                                        </div>
                                        {/* Revenue */}
                                        <p className="text-lg md:text-xl font-bold text-gray-900 dark:text-gray-50 tabular-nums">
                                            {fmt$(t.revenue)}
                                        </p>
                                        {/* Stats */}
                                        <p className="text-xs text-gray-500 text-center leading-snug">
                                            {fmtInt(t.events)} ads<br />{fmtInt(t.users)} users
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ── Revenue by Ad Type per Game ─────── */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Gamepad2 className="w-4 h-4" />
                        Revenue by Ad Type per Game
                    </CardTitle>
                    <CardDescription>Breakdown of each ad type within each game</CardDescription>
                </CardHeader>
                <CardContent>
                    {appGroups.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">No data</p>
                    ) : (
                        <div className="space-y-6">
                            {appGroups.map((group) => {
                                const groupTotal = group.types.reduce((s, t) => s + t.revenue, 0);
                                return (
                                    <div key={group.app_key_id}>
                                        {/* Game header */}
                                        {(() => {
                                            const gameInfo =
                                                gameInfoMap.get(group.app_key_id) ??
                                                gameInfoMap.get(group.app_name);
                                            const displayName = gameInfo?.title ?? group.app_name ?? "Unknown";
                                            return (
                                                <div className="flex items-center gap-2.5 mb-3">
                                                    {gameInfo?.game_icon_url ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img
                                                            src={gameInfo.game_icon_url}
                                                            alt={displayName}
                                                            className="w-8 h-8 rounded-xl object-cover border border-gray-200 dark:border-gray-700 shrink-0 shadow-sm"
                                                        />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                                                            <Gamepad2 className="w-4 h-4 text-gray-400" />
                                                        </div>
                                                    )}
                                                    <h4 className="text-sm font-semibold">{displayName}</h4>
                                                </div>
                                            );
                                        })()}
                                        {/* Donut grid per ad type */}
                                        <div className="grid grid-cols-2 gap-2 md:gap-3 pl-6">
                                            {group.types.map((t) => {
                                                const pct = barPct(t.revenue, groupTotal);
                                                const stroke = AD_TYPE_STROKE[t.ad_type] ?? "#9ca3af";
                                                return (
                                                    <div key={t.ad_type} className="flex flex-col items-center gap-1.5 p-2 md:p-3 rounded-2xl bg-gray-50 dark:bg-gray-900/50">
                                                        {/* Donut ring */}
                                                        <div className="relative w-16 h-16 flex items-center justify-center">
                                                            <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90 absolute inset-0">
                                                                <circle cx="18" cy="18" r="15.9155" fill="none" strokeWidth="3.5" className="stroke-gray-200 dark:stroke-gray-700" />
                                                                <circle
                                                                    cx="18" cy="18" r="15.9155" fill="none"
                                                                    strokeWidth="3.5"
                                                                    strokeLinecap="round"
                                                                    strokeDasharray={`${pct.toFixed(1)} ${(100 - pct).toFixed(1)}`}
                                                                    style={{ stroke }}
                                                                />
                                                            </svg>
                                                            <span className="relative text-xs font-bold text-gray-800 dark:text-gray-100 tabular-nums">
                                                                {Math.round(pct)}%
                                                            </span>
                                                        </div>
                                                        {/* Label */}
                                                        <div className="flex items-center gap-1">
                                                            {AD_TYPE_ICON[t.ad_type] ?? <Tv className="w-3 h-3" />}
                                                            <Badge variant="outline" className={`text-xs ${AD_TYPE_COLOR[t.ad_type] ?? ""}`}>
                                                                {t.ad_type}
                                                            </Badge>
                                                        </div>
                                                        {/* Revenue */}
                                                        <p className="text-sm font-bold text-gray-900 dark:text-gray-50 tabular-nums">
                                                            {fmt$(t.revenue)}
                                                        </p>
                                                        {/* Stats */}
                                                        <p className="text-[11px] text-gray-500 text-center leading-snug">
                                                            {fmtInt(t.events)} ads<br />{fmtInt(t.users)} users
                                                        </p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ── Daily Breakdown ─────────────── */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Daily Breakdown
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {daily.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">No data</p>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {daily.map((d) => {
                                const revPct = barPct(d.revenue, summary?.total_revenue ?? 0);
                                const adsPct = barPct(d.events, summary?.total_events ?? 0);
                                // inner ring: r=10, circ=2π×10≈62.83
                                const innerCirc = 62.832;
                                const innerDash = (revPct * innerCirc / 100).toFixed(1);
                                const innerGap = (innerCirc - revPct * innerCirc / 100).toFixed(1);
                                return (
                                    <div key={d.day} className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-gray-50 dark:bg-gray-900/50">
                                        {/* Dual donut rings */}
                                        <div className="relative w-24 h-24 flex items-center justify-center">
                                            <svg viewBox="0 0 36 36" className="w-24 h-24 -rotate-90 absolute inset-0">
                                                {/* Outer track + ads ring (pink, r=15.9155, circ=100) */}
                                                <circle cx="18" cy="18" r="15.9155" fill="none" strokeWidth="3" className="stroke-gray-200 dark:stroke-gray-700" />
                                                <circle
                                                    cx="18" cy="18" r="15.9155" fill="none"
                                                    strokeWidth="3"
                                                    strokeLinecap="round"
                                                    strokeDasharray={`${adsPct.toFixed(1)} ${(100 - adsPct).toFixed(1)}`}
                                                    style={{ stroke: "#ec4899" }}
                                                />
                                                {/* Inner track + revenue ring (green, r=10, circ≈62.83) */}
                                                <circle cx="18" cy="18" r="10" fill="none" strokeWidth="3" className="stroke-gray-200 dark:stroke-gray-700" />
                                                <circle
                                                    cx="18" cy="18" r="10" fill="none"
                                                    strokeWidth="3"
                                                    strokeLinecap="round"
                                                    strokeDasharray={`${innerDash} ${innerGap}`}
                                                    style={{ stroke: "#10b981" }}
                                                />
                                            </svg>
                                            {/* Center: revenue % */}
                                            <span className="relative text-sm font-bold text-gray-800 dark:text-gray-100 tabular-nums">
                                                {Math.round(revPct)}%
                                            </span>
                                        </div>
                                        {/* Ring legend */}
                                        <div className="flex items-center gap-2.5 text-[10px] text-gray-500">
                                            <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-emerald-500 shrink-0" />rev</span>
                                            <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-pink-500 shrink-0" />ads</span>
                                        </div>
                                        {/* Date */}
                                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 text-center">
                                            {fmtDateShort(d.day)}
                                        </p>
                                        {/* Revenue */}
                                        <p className="text-sm font-bold text-gray-900 dark:text-gray-50 tabular-nums">
                                            {fmt$(d.revenue)}
                                        </p>
                                        {/* Stats */}
                                        <p className="text-[11px] text-gray-500 text-center leading-snug">
                                            {fmtInt(d.events)} ads<br />{fmtInt(d.users)} users
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ── Revenue by App ──────────────── */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Gamepad2 className="w-4 h-4" />
                        Revenue by App
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {byApp.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">No data</p>
                    ) : (
                        <div className="grid grid-cols-2 gap-3 md:gap-4">
                            {byApp.map((a) => {
                                const revPct   = barPct(a.revenue, summary?.total_revenue ?? 0);
                                const adsPct   = barPct(a.events,  summary?.total_events  ?? 0);
                                const usersPct = barPct(a.users,   summary?.unique_users  ?? 0);
                                // middle ring circ = 2π × 10.5 ≈ 65.9734
                                const adsCirc = 65.9734;
                                // inner ring circ = 2π × 5.5 ≈ 34.5575
                                const revCirc = 34.5575;
                                const gameInfo =
                                    gameInfoMap.get(a.app_key_id) ??
                                    gameInfoMap.get(a.app_name);
                                const displayName = gameInfo?.title ?? a.app_name ?? "Unknown";
                                return (
                                    <div key={a.app_key_id} className="flex flex-col items-center gap-2 p-3 md:p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/50">
                                        {/* Triple concentric donut rings */}
                                        <div className="relative w-32 h-32 flex items-center justify-center">
                                            <svg viewBox="0 0 36 36" className="w-32 h-32 -rotate-90 absolute inset-0">
                                                {/* Outer track + revenue ring (green, r=15.9155, circ=100) */}
                                                <circle cx="18" cy="18" r="15.9155" fill="none" strokeWidth="2.5" className="stroke-gray-200 dark:stroke-gray-700" />
                                                <circle
                                                    cx="18" cy="18" r="15.9155" fill="none"
                                                    strokeWidth="2.5" strokeLinecap="round"
                                                    strokeDasharray={`${revPct.toFixed(1)} ${(100 - revPct).toFixed(1)}`}
                                                    style={{ stroke: "#22c55e" }}
                                                />
                                                {/* Middle track + ads ring (pink, r=10.5, circ≈65.97) */}
                                                <circle cx="18" cy="18" r="10.5" fill="none" strokeWidth="2.5" className="stroke-gray-200 dark:stroke-gray-700" />
                                                <circle
                                                    cx="18" cy="18" r="10.5" fill="none"
                                                    strokeWidth="2.5" strokeLinecap="round"
                                                    strokeDasharray={`${(adsPct * adsCirc / 100).toFixed(2)} ${(adsCirc * (1 - adsPct / 100)).toFixed(2)}`}
                                                    style={{ stroke: "#ec4899" }}
                                                />
                                                {/* Inner track + users ring (purple, r=5.5, circ≈34.56) */}
                                                <circle cx="18" cy="18" r="5.5" fill="none" strokeWidth="2.5" className="stroke-gray-200 dark:stroke-gray-700" />
                                                <circle
                                                    cx="18" cy="18" r="5.5" fill="none"
                                                    strokeWidth="2.5" strokeLinecap="round"
                                                    strokeDasharray={`${(usersPct * revCirc / 100).toFixed(2)} ${(revCirc * (1 - usersPct / 100)).toFixed(2)}`}
                                                    style={{ stroke: "#8b5cf6" }}
                                                />
                                            </svg>
                                            {/* Center: revenue % */}
                                            <span className="relative text-sm font-bold text-gray-800 dark:text-gray-100 tabular-nums">
                                                {Math.round(revPct)}%
                                            </span>
                                        </div>
                                        {/* Ring legend */}
                                        <div className="flex items-center gap-2 text-[10px] text-gray-500 flex-wrap justify-center">
                                            <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-green-500 shrink-0" />rev</span>
                                            <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-pink-500 shrink-0" />ads</span>
                                            <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-violet-500 shrink-0" />users</span>
                                        </div>
                                        {/* Game icon + name */}
                                        <div className="flex items-center gap-1.5">
                                            {gameInfo?.game_icon_url ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={gameInfo.game_icon_url}
                                                    alt={displayName}
                                                    className="w-5 h-5 rounded-md object-cover border border-gray-200 dark:border-gray-700 shrink-0"
                                                />
                                            ) : (
                                                <Gamepad2 className="w-4 h-4 text-gray-400 shrink-0" />
                                            )}
                                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 text-center leading-tight">
                                                {displayName}
                                            </span>
                                        </div>
                                        {/* Revenue */}
                                        <p className="text-sm font-bold text-gray-900 dark:text-gray-50 tabular-nums">
                                            {fmt$(a.revenue)}
                                        </p>
                                        {/* Stats */}
                                        <p className="text-[11px] text-gray-500 text-center leading-snug">
                                            {fmtInt(a.events)} ads<br />{fmtInt(a.users)} users
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Mobile bottom spacer (~half viewport height) */}
            <div className="h-[50vh] md:hidden" />
        </div>
    );
}
