"use client";

import { useCallback, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    AlertTriangle,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock,
    Copy,
    DollarSign,
    Loader2,
    RefreshCw,
    Search,
    Wallet,
    XCircle,
} from "lucide-react";
import type { EarnAppsWithdrawal } from "@/lib/earn-apps-dal";

const PAGE_SIZE = 20;

type Stats = {
    totalRequests: number;
    totalUsd: number;
    totalPoints: number;
    pendingCount: number;
    pendingUsd: number;
    pendingPoints: number;
    paidCount: number;
    paidUsd: number;
    paidPoints: number;
    deniedCount: number;
    todayCount: number;
    monthCount: number;
    byStatus: Record<string, number>;
    byMethod: Record<string, number>;
};

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    pending: { label: "Pending", variant: "secondary" },
    processing: { label: "Processing", variant: "secondary" },
    approved: { label: "Approved", variant: "default" },
    paid: { label: "Paid", variant: "default" },
    completed: { label: "Completed", variant: "default" },
    denied: { label: "Denied", variant: "destructive" },
    rejected: { label: "Rejected", variant: "destructive" },
};

function usd(value: number, digits = 2) {
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
            {sub && <p className="mt-1 text-[11px] text-gray-500 sm:text-xs">{sub}</p>}
        </div>
    );
}

function maskAccount(value: string | null | undefined) {
    if (!value) return "No account";
    if (value.length <= 10) return value;
    return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

export default function EarnAppsWithdrawalsClient() {
    const [withdrawals, setWithdrawals] = useState<EarnAppsWithdrawal[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("all");
    const [method, setMethod] = useState("all");
    const [offset, setOffset] = useState(0);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [action, setAction] = useState<{ open: boolean; withdrawal: EarnAppsWithdrawal | null; status: "paid" | "denied" }>({
        open: false,
        withdrawal: null,
        status: "paid",
    });
    const [adminNote, setAdminNote] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    const fetchStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const res = await fetch("/api/earn-apps/withdrawals/stats", { cache: "no-store" });
            if (!res.ok) throw new Error(`Failed: ${res.status}`);
            const json = await res.json();
            setStats(json.stats);
        } finally {
            setStatsLoading(false);
        }
    }, []);

    const fetchWithdrawals = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                limit: String(PAGE_SIZE),
                offset: String(offset),
                sort_by: "created_at",
                sort_order: "desc",
            });
            if (search) params.set("search", search);
            if (status !== "all") params.set("status", status);
            if (method !== "all") params.set("method", method);

            const res = await fetch(`/api/earn-apps/withdrawals?${params.toString()}`, { cache: "no-store" });
            if (!res.ok) throw new Error(`Failed: ${res.status}`);
            const json = await res.json();
            setWithdrawals(json.withdrawals ?? []);
            setTotal(json.total ?? 0);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setLoading(false);
        }
    }, [offset, search, status, method]);

    useEffect(() => { void fetchStats(); }, [fetchStats]);
    useEffect(() => { void fetchWithdrawals(); }, [fetchWithdrawals]);
    useEffect(() => { setOffset(0); }, [search, status, method]);

    const updateWithdrawal = async () => {
        if (!action.withdrawal) return;
        setActionLoading(true);
        try {
            const res = await fetch("/api/earn-apps/withdrawals", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    withdrawal_id: action.withdrawal.id,
                    status: action.status,
                    admin_note: adminNote || undefined,
                }),
            });
            const json = await res.json();
            if (!res.ok || !json.success) throw new Error(json.error || "Update failed");
            setAction({ open: false, withdrawal: null, status: "paid" });
            setAdminNote("");
            await Promise.all([fetchWithdrawals(), fetchStats()]);
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to update withdrawal");
        } finally {
            setActionLoading(false);
        }
    };

    const copy = async (value: string, id: string) => {
        await navigator.clipboard.writeText(value);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 1500);
    };

    const methods = Object.keys(stats?.byMethod ?? {});
    const statuses = Object.keys(stats?.byStatus ?? {});
    const totalPages = Math.ceil(total / PAGE_SIZE);
    const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

    return (
        <div className="mx-auto max-w-7xl space-y-4 sm:space-y-5">
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                {statsLoading ? (
                    Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="rounded-xl border border-gray-200 bg-white p-3 sm:p-4">
                            <Skeleton className="mb-3 h-4 w-24" />
                            <Skeleton className="h-7 w-28" />
                        </div>
                    ))
                ) : (
                    <>
                        <StatCard label="Total Requests" value={(stats?.totalRequests ?? 0).toLocaleString()} sub={`${stats?.monthCount ?? 0} this month`} icon={<Wallet className="h-4 w-4" />} />
                        <StatCard label="Pending" value={(stats?.pendingCount ?? 0).toLocaleString()} sub={usd(stats?.pendingUsd ?? 0)} icon={<Clock className="h-4 w-4" />} />
                        <StatCard label="Paid" value={usd(stats?.paidUsd ?? 0)} sub={`${(stats?.paidPoints ?? 0).toLocaleString()} points`} icon={<DollarSign className="h-4 w-4" />} />
                        <StatCard label="Denied" value={(stats?.deniedCount ?? 0).toLocaleString()} sub={`${stats?.todayCount ?? 0} requests today`} icon={<AlertTriangle className="h-4 w-4" />} />
                    </>
                )}
            </div>

            <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-3 sm:p-4 xl:flex-row">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search payout account, method, app, or request ID"
                        className="pl-9"
                    />
                </div>
                <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 rounded-md border border-gray-200 bg-white px-3 text-sm font-medium" aria-label="Filter by status">
                    <option value="all">All statuses</option>
                    {statuses.map((key) => <option key={key} value={key}>{key}</option>)}
                </select>
                <select value={method} onChange={(event) => setMethod(event.target.value)} className="h-10 rounded-md border border-gray-200 bg-white px-3 text-sm font-medium" aria-label="Filter by payout method">
                    <option value="all">All methods</option>
                    {methods.map((key) => <option key={key} value={key}>{key}</option>)}
                </select>
                <Button variant="outline" onClick={() => { void fetchWithdrawals(); void fetchStats(); }} disabled={loading || statsLoading}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    Refresh
                </Button>
            </div>

            {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

            <div className="space-y-3 lg:hidden">
                {loading ? (
                    Array.from({ length: 5 }).map((_, index) => (
                        <div key={index} className="rounded-xl border border-gray-200 bg-white p-4">
                            <div className="mb-3 flex items-center justify-between">
                                <Skeleton className="h-4 w-28" />
                                <Skeleton className="h-6 w-20 rounded-full" />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <Skeleton className="h-14 rounded-lg" />
                                <Skeleton className="h-14 rounded-lg" />
                                <Skeleton className="h-14 rounded-lg" />
                                <Skeleton className="h-14 rounded-lg" />
                            </div>
                        </div>
                    ))
                ) : withdrawals.length ? (
                    withdrawals.map((withdrawal) => {
                        const config = STATUS_CONFIG[withdrawal.status] ?? { label: withdrawal.status, variant: "outline" as const };
                        const canAct = ["pending", "processing", "approved"].includes(withdrawal.status);
                        return (
                            <div key={withdrawal.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                                <div className="mb-3 flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="font-mono text-xs font-semibold text-gray-900">{withdrawal.id.slice(0, 8)}</p>
                                        <p className="mt-0.5 truncate text-xs text-gray-500" title={withdrawal.app_id}>{withdrawal.app_id}</p>
                                    </div>
                                    <Badge variant={config.variant} className="shrink-0">{config.label}</Badge>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div className="rounded-lg bg-gray-50 px-3 py-2">
                                        <p className="text-[10px] font-semibold uppercase text-gray-400">Amount</p>
                                        <p className="mt-1 font-mono text-sm font-bold text-gray-900">{usd(Number(withdrawal.amount_usd ?? 0))}</p>
                                    </div>
                                    <div className="rounded-lg bg-gray-50 px-3 py-2">
                                        <p className="text-[10px] font-semibold uppercase text-gray-400">Points</p>
                                        <p className="mt-1 font-mono text-sm font-bold text-gray-900">{Number(withdrawal.points_spent ?? 0).toLocaleString()}</p>
                                    </div>
                                    <div className="rounded-lg bg-gray-50 px-3 py-2">
                                        <p className="text-[10px] font-semibold uppercase text-gray-400">User</p>
                                        <p className="mt-1 truncate font-mono text-xs text-gray-900">ad:{withdrawal.user?.ad_id_last4 ?? "none"}</p>
                                        <p className="truncate font-mono text-xs text-gray-500">install:{withdrawal.user?.install_id_last4 ?? "none"}</p>
                                    </div>
                                    <div className="rounded-lg bg-gray-50 px-3 py-2">
                                        <p className="text-[10px] font-semibold uppercase text-gray-400">Method</p>
                                        <div className="mt-1 flex items-center gap-2">
                                            <Badge variant="outline">{withdrawal.payout_method ?? "unknown"}</Badge>
                                            {withdrawal.payout_account && (
                                                <button
                                                    className="min-w-0 truncate text-xs text-gray-500"
                                                    onClick={() => void copy(withdrawal.payout_account ?? "", withdrawal.id)}
                                                >
                                                    {copiedId === withdrawal.id ? "copied" : maskAccount(withdrawal.payout_account)}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-3 flex items-center justify-between gap-3 text-xs text-gray-500">
                                    <span>{new Date(withdrawal.created_at).toLocaleDateString()}</span>
                                    {withdrawal.processed_at && <span>{new Date(withdrawal.processed_at).toLocaleDateString()}</span>}
                                </div>

                                {canAct && (
                                    <div className="mt-3 grid grid-cols-2 gap-2">
                                        <Button
                                            size="sm"
                                            className="h-9 bg-emerald-600 hover:bg-emerald-700"
                                            onClick={() => setAction({ open: true, withdrawal, status: "paid" })}
                                        >
                                            <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                                            Paid
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            className="h-9"
                                            onClick={() => setAction({ open: true, withdrawal, status: "denied" })}
                                        >
                                            <XCircle className="mr-1 h-3.5 w-3.5" />
                                            Deny
                                        </Button>
                                    </div>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <div className="rounded-xl border border-gray-200 bg-white py-10 text-center text-sm text-gray-500">
                        No withdrawal requests found
                    </div>
                )}
            </div>

            <div className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white lg:block">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Request</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Method</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="text-right">Points</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            Array.from({ length: 5 }).map((_, row) => (
                                <TableRow key={row}>
                                    {Array.from({ length: 8 }).map((__, cell) => (
                                        <TableCell key={cell}><Skeleton className="h-4 w-full" /></TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : withdrawals.length ? (
                            withdrawals.map((withdrawal) => {
                                const config = STATUS_CONFIG[withdrawal.status] ?? { label: withdrawal.status, variant: "outline" as const };
                                const canAct = ["pending", "processing", "approved"].includes(withdrawal.status);
                                return (
                                    <TableRow key={withdrawal.id}>
                                        <TableCell>
                                            <p className="font-mono text-xs text-gray-900">{withdrawal.id.slice(0, 8)}</p>
                                            <p className="max-w-56 truncate text-xs text-gray-500" title={withdrawal.app_id}>{withdrawal.app_id}</p>
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">
                                            <p>ad:{withdrawal.user?.ad_id_last4 ?? "none"}</p>
                                            <p className="text-gray-500">install:{withdrawal.user?.install_id_last4 ?? "none"}</p>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline">{withdrawal.payout_method ?? "unknown"}</Badge>
                                                {withdrawal.payout_account && (
                                                    <button
                                                        className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900"
                                                        onClick={() => void copy(withdrawal.payout_account ?? "", withdrawal.id)}
                                                    >
                                                        <Copy className="h-3 w-3" />
                                                        {copiedId === withdrawal.id ? "copied" : maskAccount(withdrawal.payout_account)}
                                                    </button>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-mono">{usd(Number(withdrawal.amount_usd ?? 0))}</TableCell>
                                        <TableCell className="text-right font-mono">{Number(withdrawal.points_spent ?? 0).toLocaleString()}</TableCell>
                                        <TableCell><Badge variant={config.variant}>{config.label}</Badge></TableCell>
                                        <TableCell className="text-sm text-gray-500">{new Date(withdrawal.created_at).toLocaleString()}</TableCell>
                                        <TableCell>
                                            {canAct ? (
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        size="sm"
                                                        className="h-8 bg-emerald-600 hover:bg-emerald-700"
                                                        onClick={() => setAction({ open: true, withdrawal, status: "paid" })}
                                                    >
                                                        <CheckCircle2 className="mr-1 h-3 w-3" />
                                                        Paid
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        className="h-8"
                                                        onClick={() => setAction({ open: true, withdrawal, status: "denied" })}
                                                    >
                                                        <XCircle className="mr-1 h-3 w-3" />
                                                        Deny
                                                    </Button>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-500">{withdrawal.processed_at ? new Date(withdrawal.processed_at).toLocaleDateString() : "No action"}</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        ) : (
                            <TableRow>
                                <TableCell colSpan={8} className="py-10 text-center text-sm text-gray-500">
                                    No withdrawal requests found
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-3 sm:px-4">
                    <p className="text-xs text-gray-500 sm:text-sm">{offset + 1}-{Math.min(offset + PAGE_SIZE, total)} of {total.toLocaleString()}</p>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="h-9 w-9 p-0" disabled={offset === 0} onClick={() => setOffset((value) => Math.max(0, value - PAGE_SIZE))}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="min-w-12 text-center text-xs font-medium text-gray-700 sm:text-sm">{currentPage} / {totalPages}</span>
                        <Button variant="outline" size="sm" className="h-9 w-9 p-0" disabled={offset + PAGE_SIZE >= total} onClick={() => setOffset((value) => value + PAGE_SIZE)}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            <Dialog open={action.open} onOpenChange={(open) => {
                if (!open) {
                    setAction({ open: false, withdrawal: null, status: "paid" });
                    setAdminNote("");
                }
            }}>
                <DialogContent className="w-[calc(100vw-2rem)] max-w-md rounded-xl">
                    <DialogHeader>
                        <DialogTitle>{action.status === "paid" ? "Mark Withdrawal Paid" : "Deny Withdrawal"}</DialogTitle>
                        <DialogDescription>
                            This updates the Earn Apps withdrawal request status and admin note. It does not mutate user point balances.
                        </DialogDescription>
                    </DialogHeader>

                    {action.withdrawal && (
                        <div className="space-y-3">
                            <div className="rounded-lg bg-gray-50 p-3 text-sm">
                                <div className="flex justify-between gap-4">
                                    <span className="text-gray-500">Amount</span>
                                    <span className="font-semibold">{usd(Number(action.withdrawal.amount_usd ?? 0))}</span>
                                </div>
                                <div className="mt-1 flex justify-between gap-4">
                                    <span className="text-gray-500">Method</span>
                                    <span className="font-semibold">{action.withdrawal.payout_method ?? "unknown"}</span>
                                </div>
                                <div className="mt-1 flex justify-between gap-4">
                                    <span className="text-gray-500">Account</span>
                                    <span className="font-mono text-xs">{maskAccount(action.withdrawal.payout_account)}</span>
                                </div>
                            </div>
                            <Input value={adminNote} onChange={(event) => setAdminNote(event.target.value)} placeholder="Admin note" />
                        </div>
                    )}

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" disabled={actionLoading} onClick={() => setAction({ open: false, withdrawal: null, status: "paid" })}>
                            Cancel
                        </Button>
                        <Button onClick={updateWithdrawal} disabled={actionLoading} variant={action.status === "denied" ? "destructive" : "default"}>
                            {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
