"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Search,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    CheckCircle2,
    XCircle,
    Clock,
    AlertTriangle,
    DollarSign,
    TrendingUp,
    Loader2,
    Copy,
    Check,
} from "lucide-react";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface WithdrawalUser {
    id: string;
    ad_id: string;
    platform: string;
    status: string;
}

interface WithdrawalMethod {
    display_name: string;
    method_key: string;
    logo_url: string;
}

interface Withdrawal {
    id: string;
    user_id: string;
    wallet_id: string;
    withdrawal_method_id: string;
    method_key: string;
    amount_points: number;
    status: string;
    destination_hash: string;
    destination_masked: string;
    destination_plain: string | null;
    destination_type: string;
    balance_before: number;
    balance_after: number;
    admin_notes: string | null;
    processed_at: string | null;
    created_at: string;
    updated_at: string;
    user: WithdrawalUser;
    method: WithdrawalMethod;
}

interface WithdrawalStats {
    success: boolean;
    total_withdrawals: number;
    total_points_withdrawn: number;
    total_completed: number;
    total_rejected: number;
    total_failed: number;
    pending_count: number;
    pending_points: number;
    today_count: number;
    today_points: number;
    today_completed: number;
    yesterday_count: number;
    yesterday_points: number;
    week_count: number;
    week_points: number;
    month_count: number;
    month_points: number;
    by_method: { method_key: string; display_name: string; count: number; total_points: number }[];
    by_status: { status: string; count: number; total_points: number }[];
}

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const PAGE_SIZE = 20;

const STATUS_BADGE: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string; icon: React.ReactNode }> = {
    pending: { variant: "outline", label: "Pending", icon: <Clock className="w-3 h-3" /> },
    processing: { variant: "secondary", label: "Processing", icon: <img src="https://res.cloudinary.com/destej60y/image/upload/v1773619307/hour-glass_vujzem.png" alt="processing" className="w-3 h-3" /> },
    completed: { variant: "default", label: "Completed", icon: <CheckCircle2 className="w-3 h-3" /> },
    failed: { variant: "destructive", label: "Failed", icon: <AlertTriangle className="w-3 h-3" /> },
    rejected: { variant: "destructive", label: "Rejected", icon: <XCircle className="w-3 h-3" /> },
};

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export default function WithdrawalsClient() {
    // ── State ──
    const [tab, setTab] = useState("dashboard");
    const [stats, setStats] = useState<WithdrawalStats | null>(null);
    const [statsLoading, setStatsLoading] = useState(true);
    const [statsError, setStatsError] = useState<string | null>(null);

    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [offset, setOffset] = useState(0);

    // Action dialog
    const [actionDialog, setActionDialog] = useState<{
        open: boolean;
        withdrawal: Withdrawal | null;
        action: "completed" | "rejected";
    }>({ open: false, withdrawal: null, action: "completed" });
    const [adminNotes, setAdminNotes] = useState("");
    const [refundPoints, setRefundPoints] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Copy state
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Conversion rate (1 coin = X USD)
    const [conversionRate, setConversionRate] = useState<number | null>(null);

    const toUsd = (points: number) => {
        if (conversionRate == null) return `${points.toLocaleString()} pts`;
        const usd = points * conversionRate;
        return `$${usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    // ── Fetch Conversion Rate ──
    useEffect(() => {
        (async () => {
            try {
                const res = await fetch("/api/kpe/config/wallet_config");
                if (!res.ok) return;
                const json = await res.json();
                const row = json.rows?.find((r: { key: string; value: number }) => r.key === "conversion_rate");
                if (row) setConversionRate(Number(row.value));
            } catch { /* ignore – falls back to showing pts */ }
        })();
    }, []);

    // ── Fetch Stats ──
    const fetchStats = useCallback(async () => {
        setStatsLoading(true);
        setStatsError(null);
        try {
            const res = await fetch("/api/kpe/withdrawals/stats");
            if (!res.ok) throw new Error(`Failed: ${res.status}`);
            const json: WithdrawalStats = await res.json();
            setStats(json);
        } catch (err) {
            setStatsError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setStatsLoading(false);
        }
    }, []);

    // ── Fetch Withdrawals ──
    const fetchWithdrawals = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                limit: String(PAGE_SIZE),
                offset: String(offset),
            });
            if (search) params.set("search", search);
            if (statusFilter !== "all") params.set("status", statusFilter);

            const res = await fetch(`/api/kpe/withdrawals?${params.toString()}`);
            if (!res.ok) throw new Error(`Failed: ${res.status}`);
            const json = await res.json();
            setWithdrawals(json.withdrawals ?? []);
            setTotal(json.total ?? 0);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setLoading(false);
        }
    }, [offset, search, statusFilter]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    useEffect(() => {
        fetchWithdrawals();
    }, [fetchWithdrawals]);

    useEffect(() => {
        setOffset(0);
    }, [search, statusFilter]);

    const totalPages = Math.ceil(total / PAGE_SIZE);
    const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

    // ── Handle Approve/Reject ──
    const openActionDialog = (withdrawal: Withdrawal, action: "completed" | "rejected") => {
        setActionDialog({ open: true, withdrawal, action });
        setAdminNotes("");
        setRefundPoints(true);
    };

    const handleAction = async () => {
        if (!actionDialog.withdrawal) return;
        setActionLoading(true);
        try {
            const res = await fetch("/api/kpe/withdrawals", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    withdrawal_id: actionDialog.withdrawal.id,
                    new_status: actionDialog.action,
                    admin_notes: adminNotes || undefined,
                    ...(actionDialog.action === "rejected" && { refund: refundPoints }),
                }),
            });
            const json = await res.json();
            if (!res.ok || !json.success) {
                throw new Error(json.error || "Operation failed");
            }
            setActionDialog({ open: false, withdrawal: null, action: "completed" });
            // Refresh both lists and stats
            fetchWithdrawals();
            fetchStats();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to update withdrawal");
        } finally {
            setActionLoading(false);
        }
    };

    // ── Copy to clipboard ──
    const copyToClipboard = async (text: string, id: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        } catch {
            // Fallback
            const el = document.createElement("textarea");
            el.value = text;
            document.body.appendChild(el);
            el.select();
            document.execCommand("copy");
            document.body.removeChild(el);
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        }
    };

    // ── Render: Stats Card ──
    const StatCard = ({ label, value, sub, icon, color }: {
        label: string;
        value: string | number;
        sub?: string;
        icon: React.ReactNode;
        color: string;
    }) => (
        <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-500 font-medium">{label}</span>
                <div className={color}>{icon}</div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{typeof value === "number" ? value.toLocaleString() : value}</p>
            {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
    );

    // ── Render: Dashboard Tab ──
    const renderDashboard = () => {
        if (statsLoading) {
            return (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-xl p-4 border border-gray-200">
                            <Skeleton className="h-4 w-20 mb-2" />
                            <Skeleton className="h-8 w-16" />
                        </div>
                    ))}
                </div>
            );
        }

        if (statsError) {
            return (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
                    <p className="font-medium">Error loading stats</p>
                    <p className="text-sm mt-1">{statsError}</p>
                    <Button variant="outline" size="sm" className="mt-2" onClick={fetchStats}>Retry</Button>
                </div>
            );
        }

        if (!stats) return null;

        return (
            <div className="space-y-6">
                {/* Pending Alert */}
                {stats.pending_count > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                        <div>
                            <p className="font-semibold text-amber-800">
                                {stats.pending_count} Pending Withdrawal{stats.pending_count !== 1 ? "s" : ""} Require Action
                            </p>
                            <p className="text-sm text-amber-600">
                                Total: {toUsd(stats.pending_points)} awaiting approval
                            </p>
                        </div>
                        <Button
                            size="sm"
                            variant="outline"
                            className="ml-auto border-amber-300 text-amber-700 hover:bg-amber-100"
                            onClick={() => {
                                setStatusFilter("processing");
                                setTab("requests");
                            }}
                        >
                            Review Now
                        </Button>
                    </div>
                )}

                {/* Time-based Stats */}
                <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Overview</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        <StatCard
                            label="Total Withdrawals"
                            value={stats.total_withdrawals}
                            icon={<DollarSign className="w-5 h-5" />}
                            color="text-blue-500"
                        />
                        <StatCard
                            label="Total Withdrawn"
                            value={toUsd(stats.total_points_withdrawn)}
                            sub="All time (completed + processing)"
                            icon={<TrendingUp className="w-5 h-5" />}
                            color="text-green-500"
                        />
                        <StatCard
                            label="Pending Requests"
                            value={stats.pending_count}
                            sub={toUsd(stats.pending_points)}
                            icon={<Clock className="w-5 h-5" />}
                            color="text-amber-500"
                        />
                        <StatCard
                            label="Completed"
                            value={stats.total_completed}
                            icon={<CheckCircle2 className="w-5 h-5" />}
                            color="text-emerald-500"
                        />
                    </div>
                </div>

                {/* Time Periods */}
                <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">By Period</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <StatCard
                            label="Today"
                            value={stats.today_count}
                            sub={`${toUsd(stats.today_points)} · ${stats.today_completed} completed`}
                            icon={<Clock className="w-5 h-5" />}
                            color="text-blue-500"
                        />
                        <StatCard
                            label="Yesterday"
                            value={stats.yesterday_count}
                            sub={toUsd(stats.yesterday_points)}
                            icon={<Clock className="w-5 h-5" />}
                            color="text-gray-500"
                        />
                        <StatCard
                            label="This Week"
                            value={stats.week_count}
                            sub={toUsd(stats.week_points)}
                            icon={<TrendingUp className="w-5 h-5" />}
                            color="text-indigo-500"
                        />
                        <StatCard
                            label="This Month"
                            value={stats.month_count}
                            sub={toUsd(stats.month_points)}
                            icon={<TrendingUp className="w-5 h-5" />}
                            color="text-purple-500"
                        />
                    </div>
                </div>

                {/* Rejected / Failed */}
                <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Issues</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <StatCard
                            label="Rejected"
                            value={stats.total_rejected}
                            icon={<XCircle className="w-5 h-5" />}
                            color="text-red-500"
                        />
                        <StatCard
                            label="Failed"
                            value={stats.total_failed}
                            icon={<AlertTriangle className="w-5 h-5" />}
                            color="text-orange-500"
                        />
                    </div>
                </div>

                {/* By Method */}
                {stats.by_method && stats.by_method.length > 0 && (
                    <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">By Method</h3>
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Method</TableHead>
                                        <TableHead className="text-right">Requests</TableHead>
                                        <TableHead className="text-right">Total (USD)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {stats.by_method.map((m) => (
                                        <TableRow key={m.method_key}>
                                            <TableCell className="font-medium">{m.display_name}</TableCell>
                                            <TableCell className="text-right">{m.count.toLocaleString()}</TableCell>
                                            <TableCell className="text-right font-mono">{toUsd(m.total_points)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                )}

                {/* By Status */}
                {stats.by_status && stats.by_status.length > 0 && (
                    <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">By Status</h3>
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Count</TableHead>
                                        <TableHead className="text-right">Total (USD)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {stats.by_status.map((s) => (
                                        <TableRow key={s.status}>
                                            <TableCell>
                                                <Badge variant={STATUS_BADGE[s.status]?.variant ?? "outline"}>
                                                    <span className="flex items-center gap-1">
                                                        {STATUS_BADGE[s.status]?.icon}
                                                        {STATUS_BADGE[s.status]?.label ?? s.status}
                                                    </span>
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">{s.count.toLocaleString()}</TableCell>
                                            <TableCell className="text-right font-mono">{toUsd(s.total_points)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // ── Render: Withdrawal Row ──
    const renderWithdrawalRow = (w: Withdrawal, showActions: boolean) => (
        <TableRow key={w.id}>
            <TableCell className="text-sm">
                {new Date(w.created_at).toLocaleDateString()}{" "}
                <span className="text-gray-400">{new Date(w.created_at).toLocaleTimeString()}</span>
            </TableCell>
            <TableCell>
                <Badge variant={STATUS_BADGE[w.status]?.variant ?? "outline"}>
                    <span className="flex items-center gap-1">
                        {STATUS_BADGE[w.status]?.icon}
                        {STATUS_BADGE[w.status]?.label ?? w.status}
                    </span>
                </Badge>
            </TableCell>
            <TableCell className="font-mono text-right">
                <span className="inline-flex items-center gap-1">
                    <DollarSign className="w-4 h-4 text-green-500" />
                    {toUsd(w.amount_points)}
                </span>
            </TableCell>
            <TableCell>{w.method?.display_name ?? w.method_key}</TableCell>
            <TableCell>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-mono">{w.destination_plain || w.destination_masked}</span>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(w.destination_plain || w.destination_masked, w.id);
                        }}
                        className="p-1.5 hover:bg-gray-100 rounded-md transition-colors border border-gray-200"
                        title="Copy destination"
                    >
                        {copiedId === w.id ? (
                            <Check className="w-4 h-4 text-green-500" />
                        ) : (
                            <Copy className="w-4 h-4 text-gray-400" />
                        )}
                    </button>
                </div>
                <span className="text-xs text-gray-400">{w.destination_type}</span>
            </TableCell>
            <TableCell className="text-sm">
                <span className="font-mono text-xs">
                    {w.user?.ad_id ? (w.user.ad_id.length > 16 ? `${w.user.ad_id.slice(0, 16)}...` : w.user.ad_id) : "—"}
                </span>
            </TableCell>
            <TableCell className="text-right text-sm text-gray-500">
                <div className="font-mono text-xs">
                    <span className="text-gray-400">Before:</span> {toUsd(w.balance_before)}
                </div>
                <div className="font-mono text-xs">
                    <span className="text-gray-400">After:</span> {toUsd(w.balance_after)}
                </div>
            </TableCell>
            <TableCell>
                {showActions && w.status === "processing" ? (
                    <div className="flex items-center gap-1">
                        <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 border-green-200 hover:bg-green-50 h-7 px-2 text-xs"
                            onClick={(e) => {
                                e.stopPropagation();
                                openActionDialog(w, "completed");
                            }}
                        >
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Approve
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-200 hover:bg-red-50 h-7 px-2 text-xs"
                            onClick={(e) => {
                                e.stopPropagation();
                                openActionDialog(w, "rejected");
                            }}
                        >
                            <XCircle className="w-3 h-3 mr-1" />
                            Reject
                        </Button>
                    </div>
                ) : (
                    <span className="text-xs text-gray-400">
                        {w.processed_at
                            ? new Date(w.processed_at).toLocaleDateString()
                            : "—"}
                    </span>
                )}
            </TableCell>
        </TableRow>
    );

    // ── Render: Withdrawal Table ──
    const renderWithdrawalTable = (showActions: boolean) => (
        <div className="space-y-4">
            {/* Filters */}
            <div className="bg-white rounded-xl p-4 border border-gray-200">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by destination (email, ID)..."
                            className="pl-9"
                        />
                    </div>
                    {!showActions && (
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue placeholder="All Statuses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="processing">Processing</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                                <SelectItem value="failed">Failed</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                    <Button variant="outline" size="icon" onClick={() => { fetchWithdrawals(); fetchStats(); }} title="Refresh">
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
                    <p className="font-medium">Error loading withdrawals</p>
                    <p className="text-sm mt-1">{error}</p>
                    <Button variant="outline" size="sm" className="mt-2" onClick={fetchWithdrawals}>Retry</Button>
                </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="min-w-[140px]">Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead>Method</TableHead>
                                <TableHead>Destination</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead className="text-right">Balance</TableHead>
                                <TableHead className="min-w-[150px]">{showActions ? "Actions" : "Processed"}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        {Array.from({ length: 8 }).map((_, j) => (
                                            <TableCell key={j}>
                                                <Skeleton className="h-4 w-full" />
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : withdrawals.length ? (
                                withdrawals.map((w) => renderWithdrawalRow(w, showActions))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                                        No withdrawals found
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                        <p className="text-sm text-gray-500">
                            Showing {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of {total}
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={offset === 0}
                                onClick={() => setOffset((prev) => Math.max(0, prev - PAGE_SIZE))}
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <span className="text-sm font-medium text-gray-700">
                                {currentPage} / {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={offset + PAGE_SIZE >= total}
                                onClick={() => setOffset((prev) => prev + PAGE_SIZE)}
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <Tabs value={tab} onValueChange={(v) => {
                setTab(v);
                // When switching to pending requests tab, auto-filter to processing
                if (v === "requests") {
                    setStatusFilter("processing");
                    setOffset(0);
                } else if (v === "all") {
                    setStatusFilter("all");
                    setOffset(0);
                }
            }}>
                <TabsList className="bg-white border border-gray-200">
                    <TabsTrigger value="dashboard" className="data-[state=active]:bg-gray-900 data-[state=active]:text-white">
                        Dashboard
                    </TabsTrigger>
                    <TabsTrigger value="requests" className="data-[state=active]:bg-gray-900 data-[state=active]:text-white relative">
                        Pending Requests
                        {stats && stats.pending_count > 0 && (
                            <span className="ml-1.5 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500 text-white min-w-[18px]">
                                {stats.pending_count}
                            </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="all" className="data-[state=active]:bg-gray-900 data-[state=active]:text-white">
                        All Withdrawals
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="dashboard" className="mt-6">
                    {renderDashboard()}
                </TabsContent>

                <TabsContent value="requests" className="mt-6">
                    {renderWithdrawalTable(true)}
                </TabsContent>

                <TabsContent value="all" className="mt-6">
                    {renderWithdrawalTable(false)}
                </TabsContent>
            </Tabs>

            {/* Approve / Reject Confirmation Dialog */}
            <Dialog open={actionDialog.open} onOpenChange={(open) => {
                if (!open) setActionDialog({ open: false, withdrawal: null, action: "completed" });
            }}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className={actionDialog.action === "completed" ? "text-green-700" : "text-red-700"}>
                            {actionDialog.action === "completed" ? "Approve Withdrawal" : "Reject Withdrawal"}
                        </DialogTitle>
                        <DialogDescription>
                            {actionDialog.action === "completed"
                                ? "This will mark the withdrawal as completed. Confirm you have sent the payment to the user."
                                : "This will reject the withdrawal and refund the points back to the user's wallet."
                            }
                        </DialogDescription>
                    </DialogHeader>

                    {actionDialog.withdrawal && (
                        <div className="space-y-3 py-2">
                            <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Amount</span>
                                    <span className="font-bold">{toUsd(actionDialog.withdrawal.amount_points)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Method</span>
                                    <span>{actionDialog.withdrawal.method?.display_name ?? actionDialog.withdrawal.method_key}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500">Destination</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono">{actionDialog.withdrawal.destination_plain || actionDialog.withdrawal.destination_masked}</span>
                                        <button
                                            onClick={() => copyToClipboard(
                                                actionDialog.withdrawal!.destination_plain || actionDialog.withdrawal!.destination_masked,
                                                `dialog-${actionDialog.withdrawal!.id}`
                                            )}
                                            className="p-1.5 hover:bg-gray-200 rounded-md transition-colors border border-gray-200"
                                            title="Copy destination"
                                        >
                                            {copiedId === `dialog-${actionDialog.withdrawal.id}` ? (
                                                <Check className="w-4 h-4 text-green-500" />
                                            ) : (
                                                <Copy className="w-4 h-4 text-gray-400" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">User</span>
                                    <span className="font-mono text-xs">
                                        {actionDialog.withdrawal.user?.ad_id
                                            ? (actionDialog.withdrawal.user.ad_id.length > 20
                                                ? `${actionDialog.withdrawal.user.ad_id.slice(0, 20)}...`
                                                : actionDialog.withdrawal.user.ad_id)
                                            : "—"}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Requested</span>
                                    <span>{new Date(actionDialog.withdrawal.created_at).toLocaleString()}</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Admin Notes (optional)
                                </label>
                                <Input
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    placeholder={actionDialog.action === "rejected" ? "Reason for rejection..." : "Payment reference, notes..."}
                                    maxLength={500}
                                />
                            </div>

                            {actionDialog.action === "rejected" && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label htmlFor="refund-toggle" className="text-sm font-medium text-gray-700">
                                            Refund points to user
                                        </label>
                                        <button
                                            id="refund-toggle"
                                            type="button"
                                            role="switch"
                                            aria-checked={refundPoints ? "true" : "false"}
                                            onClick={() => setRefundPoints(!refundPoints)}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                                refundPoints ? "bg-green-500" : "bg-gray-300"
                                            }`}
                                        >
                                            <span
                                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                    refundPoints ? "translate-x-6" : "translate-x-1"
                                                }`}
                                            />
                                        </button>
                                    </div>
                                    {refundPoints ? (
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                                            <p className="font-medium flex items-center gap-1">
                                                <AlertTriangle className="w-4 h-4" />
                                                Points will be refunded
                                            </p>
                                            <p className="mt-1">
                                                {toUsd(actionDialog.withdrawal.amount_points)} will be credited back to the user&apos;s wallet.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
                                            <p className="font-medium flex items-center gap-1">
                                                <AlertTriangle className="w-4 h-4" />
                                                No refund
                                            </p>
                                            <p className="mt-1">
                                                {toUsd(actionDialog.withdrawal.amount_points)} will NOT be returned. The user loses these points.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => setActionDialog({ open: false, withdrawal: null, action: "completed" })}
                            disabled={actionLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant={actionDialog.action === "completed" ? "default" : "destructive"}
                            onClick={handleAction}
                            disabled={actionLoading}
                        >
                            {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {actionDialog.action === "completed" ? "Confirm Approval" : "Confirm Rejection"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
