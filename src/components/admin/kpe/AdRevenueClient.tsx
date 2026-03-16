"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    Loader2,
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

    // Auto-refresh for chart
    const [autoRefresh, setAutoRefresh] = useState(false);
    const autoRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

    // Auto-refresh cleanup
    useEffect(() => {
        if (autoRefresh) {
            autoRefreshRef.current = setInterval(() => {
                fetchAll(fromDate || undefined, toDate || undefined);
            }, 30_000);
        }
        return () => {
            if (autoRefreshRef.current) clearInterval(autoRefreshRef.current);
        };
    }, [autoRefresh, fetchAll, fromDate, toDate]);

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
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
                    {[1, 2, 3, 4, 5].map((i) => (
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

    const maxDailyRevenue = Math.max(0, ...daily.map((d) => d.revenue));
    const maxAppRevenue = Math.max(0, ...byApp.map((a) => a.revenue));
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
            <div className="flex flex-col sm:flex-row items-end gap-3">
                <div className="flex items-end gap-2 flex-1 w-full sm:w-auto flex-wrap">
                    <div className="space-y-1">
                        <Label className="text-xs text-gray-500">From</Label>
                        <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-40" />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-gray-500">To</Label>
                        <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-40" />
                    </div>
                    <Button size="sm" onClick={handleFilter}>
                        <Calendar className="w-4 h-4 mr-1.5" />
                        Filter
                    </Button>
                    {(fromDate || toDate) && (
                        <Button variant="outline" size="sm" onClick={clearFilter}>
                            Clear
                        </Button>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant={autoRefresh ? "default" : "outline"}
                        size="sm"
                        onClick={() => setAutoRefresh((v) => !v)}
                    >
                        {autoRefresh ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Activity className="w-4 h-4 mr-1.5" />}
                        {autoRefresh ? "Live" : "Auto"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => fetchAll(fromDate || undefined, toDate || undefined)}>
                        <RefreshCw className="w-4 h-4 mr-1.5" />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* ── Summary Cards ──────────────── */}
            {summary && (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardDescription className="text-sm font-medium">Total Revenue</CardDescription>
                            <DollarSign className="w-5 h-5 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                                {fmt$(summary.total_revenue)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                across {fmtInt(summary.total_events)} events
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardDescription className="text-sm font-medium">Avg / Event</CardDescription>
                            <TrendingUp className="w-5 h-5 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                                {fmt$(summary.avg_revenue_per_event)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                revenue per ad event
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardDescription className="text-sm font-medium">Total Events</CardDescription>
                            <Activity className="w-5 h-5 text-orange-500" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">
                                {fmtInt(summary.total_events)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                ad impressions recorded
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardDescription className="text-sm font-medium">Unique Users</CardDescription>
                            <Users className="w-5 h-5 text-indigo-500" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-400">
                                {fmtInt(summary.unique_users)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                distinct players
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardDescription className="text-sm font-medium">Days Active</CardDescription>
                            <BarChart3 className="w-5 h-5 text-purple-500" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">
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
                        {autoRefresh && (
                            <Badge variant="outline" className="ml-2 text-xs animate-pulse">LIVE</Badge>
                        )}
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
                                <div className="flex">
                                    {/* Y-axis labels */}
                                    <div className="flex flex-col-reverse justify-between h-52 pr-2 py-0.5 shrink-0">
                                        {yTicks.map((tick, i) => (
                                            <span key={i} className="text-[10px] text-gray-400 tabular-nums text-right w-14 leading-none">
                                                {tick < 0.01 ? `$${tick.toFixed(4)}` : `$${tick.toFixed(2)}`}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Chart grid + bars */}
                                    <div className="flex-1 relative min-w-0">
                                        {/* Horizontal grid lines */}
                                        <div className="absolute inset-0 flex flex-col-reverse justify-between pointer-events-none h-52">
                                            {yTicks.map((_, i) => (
                                                <div key={i} className={`border-t ${i === 0 ? "border-gray-300 dark:border-gray-600" : "border-gray-100 dark:border-gray-800"}`} />
                                            ))}
                                        </div>

                                        {/* Bars */}
                                        <TooltipProvider delayDuration={0}>
                                            <div className="relative h-52 flex items-end overflow-x-auto">
                                                <div className={`flex items-end w-full ${chartDays.length <= 7 ? "justify-around" : "gap-1"}`}>
                                                    {chartDays.map((day, dayIdx) => {
                                                        const dayRows = chart.filter((r) => r.day === day);
                                                        const dayTotal = dayTotals[dayIdx];

                                                        return (
                                                            <div key={day} className="flex flex-col items-center min-w-12" style={{ flex: chartDays.length <= 7 ? "0 0 auto" : "1 1 0" }}>
                                                                {/* Revenue label on top */}
                                                                <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1 tabular-nums">
                                                                    {fmt$(dayTotal)}
                                                                </span>

                                                                {/* Bars group */}
                                                                <div className="flex items-end gap-0.75">
                                                                    {chartAdTypes.map((adType) => {
                                                                        const row = dayRows.find((r) => r.ad_type === adType);
                                                                        const revenue = row?.revenue ?? 0;
                                                                        const barH = maxDayTotal > 0
                                                                            ? Math.max(4, (revenue / maxDayTotal) * 176)
                                                                            : 4;
                                                                        return (
                                                                            <Tooltip key={adType}>
                                                                                <TooltipTrigger asChild>
                                                                                    <div
                                                                                        className={`rounded-t-sm cursor-pointer transition-all hover:opacity-80 ${AD_TYPE_BAR_COLOR[adType] ?? "bg-gray-400"}`}
                                                                                        style={{
                                                                                            height: `${barH}px`,
                                                                                            width: chartDays.length <= 3 ? "28px" : chartDays.length <= 7 ? "20px" : "12px",
                                                                                        }}
                                                                                    />
                                                                                </TooltipTrigger>
                                                                                <TooltipContent side="top" className="text-xs space-y-0.5">
                                                                                    <p className="font-semibold">{fmtDate(day)}</p>
                                                                                    <p className="capitalize">{adType}: {fmt$(revenue)}</p>
                                                                                    <p className="text-gray-400">{fmtInt(row?.events ?? 0)} events · {fmtInt(row?.users ?? 0)} users</p>
                                                                                </TooltipContent>
                                                                            </Tooltip>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </TooltipProvider>

                                        {/* X-axis date labels */}
                                        <div className={`flex w-full mt-2 border-t border-gray-200 dark:border-gray-700 pt-2 ${chartDays.length <= 7 ? "justify-around" : "gap-1"}`}>
                                            {chartDays.map((day) => (
                                                <div key={day} className="min-w-12 text-center" style={{ flex: chartDays.length <= 7 ? "0 0 auto" : "1 1 0" }}>
                                                    <span className="text-[11px] font-medium text-gray-600 dark:text-gray-400">
                                                        {fmtDateShort(day)}
                                                    </span>
                                                </div>
                                            ))}
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
                        <div className="space-y-4">
                            {byType.map((t) => (
                                <div key={t.ad_type} className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 w-32 shrink-0">
                                        {AD_TYPE_ICON[t.ad_type] ?? <Tv className="w-4 h-4" />}
                                        <Badge className={AD_TYPE_COLOR[t.ad_type] ?? "bg-gray-100 text-gray-800"}>
                                            {t.ad_type}
                                        </Badge>
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="font-medium">{fmt$(t.revenue)}</span>
                                            <span className="text-gray-500">
                                                {fmtInt(t.events)} events · {fmtInt(t.users)} users
                                            </span>
                                        </div>
                                        <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${AD_TYPE_BAR_COLOR[t.ad_type] ?? "bg-gray-400"}`}
                                                style={{ width: `${summary ? barPct(t.revenue, summary.total_revenue) : 50}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
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
                                const groupMax = Math.max(0, ...group.types.map((t) => t.revenue));
                                return (
                                    <div key={group.app_key_id}>
                                        <div className="flex items-center gap-2 mb-3">
                                            <Gamepad2 className="w-4 h-4 text-gray-500" />
                                            <h4 className="text-sm font-semibold">{group.app_name ?? "Unknown"}</h4>
                                            <span className="text-xs text-gray-400 font-mono">{group.app_key_id.slice(0, 8)}…</span>
                                        </div>
                                        <div className="space-y-2 pl-6">
                                            {group.types.map((t) => (
                                                <div key={t.ad_type} className="flex items-center gap-3">
                                                    <div className="flex items-center gap-1.5 w-28 shrink-0">
                                                        {AD_TYPE_ICON[t.ad_type] ?? <Tv className="w-3 h-3" />}
                                                        <Badge variant="outline" className={`text-xs ${AD_TYPE_COLOR[t.ad_type] ?? ""}`}>
                                                            {t.ad_type}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex-1 space-y-0.5">
                                                        <div className="flex justify-between text-xs">
                                                            <span className="font-medium">{fmt$(t.revenue)}</span>
                                                            <span className="text-gray-500">
                                                                {fmtInt(t.events)} events · {fmtInt(t.users)} users
                                                            </span>
                                                        </div>
                                                        <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full ${AD_TYPE_BAR_COLOR[t.ad_type] ?? "bg-gray-400"}`}
                                                                style={{ width: `${barPct(t.revenue, groupMax)}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
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
                        <div className="space-y-3">
                            {daily.map((d) => (
                                <div key={d.day} className="flex items-center gap-4">
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300 w-28 shrink-0">
                                        {fmtDate(d.day)}
                                    </span>
                                    <div className="flex-1">
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-semibold text-green-700 dark:text-green-400">{fmt$(d.revenue)}</span>
                                            <span className="text-gray-500 text-xs">
                                                {fmtInt(d.events)} events · {fmtInt(d.users)} users · {d.ad_types} types · {d.apps} apps
                                            </span>
                                        </div>
                                        <div className="h-2.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-linear-to-r from-green-400 to-emerald-600"
                                                style={{ width: `${barPct(d.revenue, maxDailyRevenue)}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
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
                        <div className="space-y-4">
                            {byApp.map((a) => (
                                <div key={a.app_key_id} className="flex items-center gap-4">
                                    <div className="w-32 shrink-0">
                                        <p className="text-sm font-medium truncate">{a.app_name ?? "Unknown"}</p>
                                        <p className="text-xs text-gray-400 font-mono truncate">{a.app_key_id.slice(0, 8)}…</p>
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="font-semibold text-green-700 dark:text-green-400">{fmt$(a.revenue)}</span>
                                            <span className="text-gray-500 text-xs">
                                                {fmtInt(a.events)} events · {fmtInt(a.users)} users
                                            </span>
                                        </div>
                                        <div className="h-2.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-linear-to-r from-purple-400 to-indigo-600"
                                                style={{ width: `${barPct(a.revenue, maxAppRevenue)}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
