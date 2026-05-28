"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Activity, AlertTriangle, CalendarDays, Check, Coins, DollarSign, Loader2, RefreshCw, Trash2, Users, Wallet, XCircle } from "lucide-react";

type AxiomTable = {
    fields: Array<{ name: string; type: string }>;
    columns: Array<Array<unknown>>;
};

type ApiResponse = {
    success: boolean;
    economy: {
        users: {
            totalUsers: number;
            activeLast24h: number;
            totalRevenueUsd: number;
            totalPointsBalance: number;
            lifetimePoints: number;
            withdrawnPoints: number;
        };
        withdrawals: {
            totalRequests: number;
            totalUsd: number;
            totalPoints: number;
            pendingCount: number;
            pendingUsd: number;
            paidCount: number;
            paidUsd: number;
            byStatus: Record<string, number>;
            byMethod: Record<string, number>;
        };
    };
    axiom: {
        revenueSummary: AxiomTable | null;
        revenueByApp: AxiomTable | null;
        eventsOverTime: AxiomTable | null;
        eventsByName: AxiomTable | null;
        recentEvents: AxiomTable | null;
    };
};

type DateTimeRange = {
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
};

function parseTable(table: AxiomTable | null): Record<string, unknown>[] {
    if (!table?.fields?.length || !table.columns?.length) return [];
    const names = table.fields.map((field) => field.name);
    const rowCount = table.columns[0]?.length ?? 0;
    const rows: Record<string, unknown>[] = [];
    for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
        const row: Record<string, unknown> = {};
        names.forEach((name, columnIndex) => {
            row[name] = table.columns[columnIndex]?.[rowIndex] ?? null;
        });
        rows.push(row);
    }
    return rows;
}

function pad2(value: number) {
    return String(value).padStart(2, "0");
}

function dateValue(date: Date) {
    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function timeValue(date: Date) {
    return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

function defaultRange(): DateTimeRange {
    const end = new Date();
    const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 0, 0);
    return {
        startDate: dateValue(start),
        startTime: timeValue(start),
        endDate: dateValue(end),
        endTime: timeValue(end),
    };
}

function toDate(date: string, time: string) {
    const value = new Date(date);
    const [hours = "0", minutes = "0"] = time.split(":");
    value.setHours(Number(hours), Number(minutes), 0, 0);
    return Number.isNaN(value.getTime()) ? null : value;
}

function toQuery(range: DateTimeRange) {
    return {
        start: toDate(range.startDate, range.startTime)?.toISOString(),
        end: toDate(range.endDate, range.endTime)?.toISOString(),
    };
}

function usd(value: number, digits = 4) {
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
}

function StatCard({ label, value, sub, icon }: { label: string; value: string; sub?: string; icon: React.ReactNode }) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-3 sm:p-4">
            <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 sm:text-xs">{label}</span>
                <span className="text-gray-500">{icon}</span>
            </div>
            <p className="break-words font-mono text-lg font-bold text-gray-900 sm:text-xl">{value}</p>
            {sub && <p className="mt-1 line-clamp-2 text-[11px] text-gray-500 sm:text-xs">{sub}</p>}
        </div>
    );
}

export default function EarnAppsAdRevenueClient() {
    const [data, setData] = useState<ApiResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [draftRange, setDraftRange] = useState<DateTimeRange>(() => defaultRange());
    const [appliedRange, setAppliedRange] = useState<DateTimeRange>(() => defaultRange());
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState("");
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [deleteResult, setDeleteResult] = useState<string | null>(null);

    const fetchData = useCallback(async (range: DateTimeRange) => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            const query = toQuery(range);
            if (query.start) params.set("startTime", query.start);
            if (query.end) params.set("endTime", query.end);
            const res = await fetch(`/api/earn-apps/ad-revenue?${params.toString()}`, { cache: "no-store" });
            if (!res.ok) throw new Error(`Failed: ${res.status}`);
            setData(await res.json());
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { void fetchData(appliedRange); }, [fetchData, appliedRange]);

    const deleteEarnAppsLogs = async () => {
        if (deleteConfirmText !== "earn-apps-logs") return;

        setDeleteLoading(true);
        setDeleteError(null);
        setDeleteResult(null);

        try {
            const res = await fetch("/api/axiom/trim", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ dataset: "earn-apps-logs" }),
            });
            const json = await res.json();
            if (!res.ok || !json.success) {
                throw new Error(json.error || "Failed to delete dataset data");
            }

            setDeleteDialogOpen(false);
            setDeleteConfirmText("");
            setDeleteResult(`Deleted data from earn-apps-logs. Trimmed blocks: ${json.trimmedBlocksCount ?? 0}.`);
            await fetchData(appliedRange);
        } catch (err) {
            setDeleteError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setDeleteLoading(false);
        }
    };

    if (loading && !data) {
        return (
            <div className="mx-auto max-w-7xl space-y-4 sm:space-y-5">
                <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, index) => (
                        <div key={index} className="rounded-xl border border-gray-200 bg-white p-3 sm:p-4">
                            <Skeleton className="mb-3 h-4 w-24" />
                            <Skeleton className="h-7 w-32" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="mx-auto max-w-7xl rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 sm:p-5">
                <p className="font-semibold">Failed to load Earn Apps ad revenue</p>
                <p className="mt-1 text-sm">{error ?? "Unknown error"}</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => void fetchData(appliedRange)}>Retry</Button>
            </div>
        );
    }

    const summary = parseTable(data.axiom.revenueSummary)[0] ?? {};
    const byApp = parseTable(data.axiom.revenueByApp);
    const events = parseTable(data.axiom.eventsByName);
    const overTime = parseTable(data.axiom.eventsOverTime);
    const recent = parseTable(data.axiom.recentEvents);
    const maxEvents = Math.max(1, ...overTime.map((row) => Number(row.events ?? 0)));

    const axiomRevenue = Number(summary.total_revenue ?? 0);
    const axiomEvents = Number(summary.total_events ?? 0);
    const axiomPoints = Number(summary.total_points ?? 0);
    const uniqueUsers = Number(summary.unique_users ?? 0);
    const withdrawals = data.economy.withdrawals;
    const users = data.economy.users;

    return (
        <div className="mx-auto max-w-7xl space-y-4 sm:space-y-5">
            <div className="rounded-xl border border-gray-200 bg-white p-3 sm:p-4">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        {(["start", "end"] as const).map((side) => (
                            <div key={side} className="grid grid-cols-[1fr_104px] gap-2">
                                <input
                                    type="date"
                                    value={side === "start" ? draftRange.startDate : draftRange.endDate}
                                    onChange={(event) => setDraftRange((range) => ({ ...range, [side === "start" ? "startDate" : "endDate"]: event.target.value }))}
                                    className="h-10 min-w-0 rounded-md border border-gray-200 px-3 text-sm font-medium"
                                    aria-label={`${side} date`}
                                />
                                <input
                                    type="time"
                                    value={side === "start" ? draftRange.startTime : draftRange.endTime}
                                    onChange={(event) => setDraftRange((range) => ({ ...range, [side === "start" ? "startTime" : "endTime"]: event.target.value }))}
                                    className="h-10 rounded-md border border-gray-200 px-3 text-sm font-medium"
                                    aria-label={`${side} time`}
                                />
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                        <Button className="h-10" onClick={() => setAppliedRange(draftRange)} disabled={loading}>
                            <Check className="mr-2 h-4 w-4" />
                            Apply
                        </Button>
                        <Button className="h-10" variant="outline" onClick={() => { const range = defaultRange(); setDraftRange(range); setAppliedRange(range); }} disabled={loading}>
                            <XCircle className="mr-2 h-4 w-4" />
                            Reset
                        </Button>
                        <Button className="h-10" variant="outline" onClick={() => void fetchData(appliedRange)} disabled={loading}>
                            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                            Refresh
                        </Button>
                        <Button
                            className="h-10"
                            variant="destructive"
                            onClick={() => {
                                setDeleteError(null);
                                setDeleteDialogOpen(true);
                            }}
                            disabled={loading}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Logs
                        </Button>
                    </div>
                </div>
            </div>

            {(deleteResult || deleteError) && (
                <div className={`rounded-xl border p-4 text-sm ${
                    deleteError
                        ? "border-red-200 bg-red-50 text-red-700"
                        : "border-emerald-200 bg-emerald-50 text-emerald-700"
                }`}>
                    {deleteError ?? deleteResult}
                </div>
            )}

            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                <StatCard label="Axiom Revenue" value={usd(axiomRevenue)} sub={`${axiomEvents.toLocaleString()} applied events`} icon={<DollarSign className="h-4 w-4" />} />
                <StatCard label="Points Awarded" value={axiomPoints.toLocaleString()} sub={`${uniqueUsers.toLocaleString()} unique users in logs`} icon={<Coins className="h-4 w-4" />} />
                <StatCard label="Supabase Revenue" value={usd(users.totalRevenueUsd)} sub={`${users.totalUsers.toLocaleString()} tracked users`} icon={<Users className="h-4 w-4" />} />
                <StatCard label="Paid Withdrawals" value={usd(withdrawals.paidUsd, 2)} sub={`${withdrawals.paidCount.toLocaleString()} paid requests`} icon={<Wallet className="h-4 w-4" />} />
            </div>

            <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-xl border border-gray-200 bg-white p-3 sm:p-4">
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-800">
                        <Activity className="h-4 w-4 text-blue-500" />
                        Applied Revenue Over Time
                    </h3>
                    {overTime.length ? (
                        <div className="flex h-40 items-end gap-0.5 sm:h-48 sm:gap-1">
                            {overTime.map((row, index) => (
                                <div
                                    key={index}
                                    className="min-w-1 flex-1 rounded-t bg-blue-500"
                                    style={{ height: `${Math.max(3, (Number(row.events ?? 0) / maxEvents) * 100)}%` }}
                                    title={`${row._time}: ${row.events} events`}
                                />
                            ))}
                        </div>
                    ) : (
                        <p className="py-12 text-center text-sm text-gray-500">No applied revenue events in this range</p>
                    )}
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-3 sm:p-4">
                    <h3 className="mb-3 text-sm font-semibold text-gray-800">Revenue By App</h3>
                    <div className="space-y-3">
                        {byApp.length ? byApp.map((row) => (
                            <div key={String(row.app_id)} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                                <p className="truncate text-sm font-semibold text-gray-900" title={String(row.app_id)}>{String(row.app_id)}</p>
                                <div className="mt-2 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
                                    <span><b>{Number(row.events ?? 0).toLocaleString()}</b> events</span>
                                    <span><b>{usd(Number(row.revenue ?? 0))}</b></span>
                                    <span className="col-span-2 sm:col-span-1"><b>{Number(row.users ?? 0).toLocaleString()}</b> users</span>
                                </div>
                            </div>
                        )) : (
                            <p className="py-8 text-center text-sm text-gray-500">No app revenue data</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid gap-5 xl:grid-cols-2">
                <div className="rounded-xl border border-gray-200 bg-white p-3 sm:p-4">
                    <h3 className="mb-3 text-sm font-semibold text-gray-800">Event Mix</h3>
                    <div className="space-y-2">
                        {events.slice(0, 10).map((row) => (
                            <div key={String(row.event)} className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2">
                                <span className="truncate text-sm text-gray-700">{String(row.event)}</span>
                                <span className="font-mono text-sm font-semibold text-gray-900">{Number(row.count ?? 0).toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-3 sm:p-4">
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-800">
                        <CalendarDays className="h-4 w-4 text-gray-500" />
                        Recent Events
                    </h3>
                    <div className="max-h-80 space-y-2 overflow-auto pr-1">
                        {recent.slice(0, 20).map((row, index) => (
                            <div key={`${row._time}-${index}`} className="rounded-lg border border-gray-100 p-3">
                                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                                    <span className="truncate text-sm font-semibold text-gray-900">{String(row.event)}</span>
                                    <span className="text-xs text-gray-500">{new Date(String(row._time)).toLocaleString()}</span>
                                </div>
                                <p className="mt-1 truncate text-xs text-gray-500">
                                    {String(row.app_id ?? "unknown app")} · user {String(row.ad_id_last4 ?? row.user_id ?? "unknown")}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <Dialog open={deleteDialogOpen} onOpenChange={(open) => {
                setDeleteDialogOpen(open);
                if (!open) {
                    setDeleteConfirmText("");
                    setDeleteError(null);
                }
            }}>
                <DialogContent className="w-[calc(100vw-2rem)] max-w-md rounded-xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-700">
                            <AlertTriangle className="h-5 w-5" />
                            Delete Earn Apps Axiom Logs
                        </DialogTitle>
                        <DialogDescription>
                            This permanently deletes data inside the Axiom dataset earn-apps-logs only. Supabase users and withdrawals are not deleted.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3">
                        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                            This action is destructive and available only to SUPER_ADMIN accounts.
                        </div>
                        <label className="block text-sm font-medium text-gray-700">
                            Type <span className="font-mono font-bold">earn-apps-logs</span> to confirm
                        </label>
                        <input
                            value={deleteConfirmText}
                            onChange={(event) => setDeleteConfirmText(event.target.value)}
                            className="h-10 w-full rounded-md border border-gray-200 px-3 font-mono text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                            autoComplete="off"
                            disabled={deleteLoading}
                        />
                        {deleteError && (
                            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{deleteError}</p>
                        )}
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            disabled={deleteLoading}
                            onClick={() => setDeleteDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            disabled={deleteLoading || deleteConfirmText !== "earn-apps-logs"}
                            onClick={() => void deleteEarnAppsLogs()}
                        >
                            {deleteLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Trash2 className="mr-2 h-4 w-4" />
                            )}
                            Delete Dataset Data
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
