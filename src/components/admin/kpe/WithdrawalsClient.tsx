"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
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
    Wallet,
    ArrowRight,
    User,
    CalendarDays,
    ChevronDown,
    ArrowUpDown,
    Plus,
    Download,
} from "lucide-react";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface WithdrawalUser {
    id: string;
    ad_id: string;
    platform: string;
    status: string;
    user_profile?: { display_name: string } | null;
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

const STATUS_CONFIG: Record<string, {
    variant: "default" | "secondary" | "destructive" | "outline";
    label: string;
    icon: React.ReactNode;
    border: string;
    bg: string;
    text: string;
    dot: string;
}> = {
    pending:    { variant: "outline",     label: "Pending",    icon: <Clock className="w-3 h-3" />,          border: "border-l-blue-400",   bg: "bg-blue-50",   text: "text-blue-700",   dot: "bg-blue-400"   },
    processing: { variant: "secondary",   label: "Processing", icon: <img src="https://res.cloudinary.com/destej60y/image/upload/v1773619307/hour-glass_vujzem.png" alt="processing" className="w-3 h-3" />, border: "border-l-amber-400", bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400" },
    completed:  { variant: "default",     label: "Completed",  icon: <CheckCircle2 className="w-3 h-3" />,   border: "border-l-emerald-400",bg: "bg-emerald-50",text: "text-emerald-700",dot: "bg-emerald-400"},
    failed:     { variant: "destructive", label: "Failed",     icon: <AlertTriangle className="w-3 h-3" />,  border: "border-l-orange-400", bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-400" },
    rejected:   { variant: "destructive", label: "Rejected",   icon: <XCircle className="w-3 h-3" />,        border: "border-l-red-400",    bg: "bg-red-50",    text: "text-red-700",    dot: "bg-red-400"    },
};

const STATUS_FILTERS = [
    { value: "all",        label: "All" },
    { value: "processing", label: "Processing" },
    { value: "completed",  label: "Completed" },
    { value: "pending",    label: "Pending" },
    { value: "rejected",   label: "Rejected" },
    { value: "failed",     label: "Failed" },
];

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

interface WithdrawalsClientProps {
    initialTab?: string;
    initialMethod?: string;
}

const BASE = "/admin/keepplay-engine/withdrawals";

export default function WithdrawalsClient({
    initialTab = "dashboard",
    initialMethod = "all",
}: WithdrawalsClientProps) {
    const router = useRouter();

    // ── State ──
    const [tab, setTab] = useState(initialTab);
    const [stats, setStats] = useState<WithdrawalStats | null>(null);
    const [statsLoading, setStatsLoading] = useState(true);
    const [statsError, setStatsError] = useState<string | null>(null);

    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>(
        initialTab === "requests" ? "processing" : "all"
    );
    const [methodFilter, setMethodFilter] = useState<string>(initialMethod);
    const [sortBy, setSortBy] = useState<string>("newest");
    const [showSortMenu, setShowSortMenu] = useState(false);
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

    // PayPal payout list for CSV export
    const [payoutList, setPayoutList] = useState<{ withdrawalId: string; email: string; amountPoints: number }[]>([]);

    // Conversion rate (1 coin = X USD)
    const [conversionRate, setConversionRate] = useState<number | null>(null);

    const toUsd = (points: number) => {
        if (conversionRate == null) return `${points.toLocaleString()} pts`;
        const usd = points * conversionRate;
        return `$${usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    // ── PayPal Payout helpers ──
    const addToPayoutList = (w: Withdrawal) => {
        const email = w.destination_plain || w.destination_masked;
        if (payoutList.some(p => p.withdrawalId === w.id)) return;
        setPayoutList(prev => [...prev, { withdrawalId: w.id, email, amountPoints: w.amount_points }]);
    };

    const downloadPayoutCsv = () => {
        if (payoutList.length === 0) return;
        const header = "Email/Phone,Amount,Currency code,Reference ID (optional),Note to recipient,Recipient wallet,Social Feed Privacy (optional),Holler URL (deprecated),Logo URL (optional),Purpose (optional)";
        const rows = payoutList.map(p => {
            const usdAmount = conversionRate != null ? (p.amountPoints * conversionRate).toFixed(2) : p.amountPoints.toFixed(2);
            return `${p.email},${usdAmount},USD,,KeepPlay ❤️,PayPal,,,,`;
        });
        const csv = [header, ...rows].join("\n");
        const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const now = new Date();
        const ts = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,"0")}${String(now.getDate()).padStart(2,"0")}_${String(now.getHours()).padStart(2,"0")}${String(now.getMinutes()).padStart(2,"0")}${String(now.getSeconds()).padStart(2,"0")}`;
        const filename = `KPE_PayPal_Payout_${ts}.csv`;
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
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
    const StatCard = ({ label, value, sub, icon, color, accent }: {
        label: string;
        value: string | number;
        sub?: string;
        icon: React.ReactNode;
        color: string;
        accent?: string;
    }) => (
        <div className={`bg-white rounded-2xl p-4 border border-gray-100 shadow-sm border-l-4 ${accent ?? "border-l-gray-200"}`}>
            <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide truncate">{label}</p>
                    <p className="text-xl font-bold text-gray-900 mt-1 leading-tight">
                        {typeof value === "number" ? value.toLocaleString() : value}
                    </p>
                    {sub && <p className="text-xs text-gray-400 mt-0.5 truncate">{sub}</p>}
                </div>
                <div className={`p-2 rounded-xl ${color} bg-opacity-10 ml-2 shrink-0`}>
                    <div className={color}>{icon}</div>
                </div>
            </div>
        </div>
    );

    // ── Render: Dashboard Tab ──
    const renderDashboard = () => {
        if (statsLoading) {
            return (
                <div className="grid grid-cols-2 gap-3">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                            <Skeleton className="h-3 w-16 mb-3 rounded-full" />
                            <Skeleton className="h-6 w-12 rounded-md" />
                        </div>
                    ))}
                </div>
            );
        }

        if (statsError) {
            return (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700">
                    <p className="font-medium">Error loading stats</p>
                    <p className="text-sm mt-1">{statsError}</p>
                    <Button variant="outline" size="sm" className="mt-2" onClick={fetchStats}>Retry</Button>
                </div>
            );
        }

        if (!stats) return null;

        return (
            <div className="space-y-5">
                {/* Pending Alert */}
                {stats.pending_count > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-amber-100 rounded-xl shrink-0">
                                <AlertTriangle className="w-4 h-4 text-amber-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-amber-800 text-sm">
                                    {stats.pending_count} Request{stats.pending_count !== 1 ? "s" : ""} Need Action
                                </p>
                                <p className="text-xs text-amber-600 mt-0.5">
                                    {toUsd(stats.pending_points)} awaiting approval
                                </p>
                            </div>
                        </div>
                        <Button
                            size="sm"
                            className="w-full mt-3 bg-amber-500 hover:bg-amber-600 text-white border-0 h-9 rounded-xl font-medium"
                            onClick={() => router.push(`${BASE}/pending`)}
                        >
                            Review Now →
                        </Button>
                    </div>
                )}

                {/* Overview */}
                <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 px-1">Overview</p>
                    <div className="grid grid-cols-2 gap-3">
                        <StatCard label="Total Requests"   value={stats.total_withdrawals}             icon={<DollarSign className="w-4 h-4" />}   color="text-blue-500"    accent="border-l-blue-400" />
                        <StatCard label="Total Withdrawn"  value={toUsd(stats.total_points_withdrawn)} sub="All time"                               icon={<TrendingUp className="w-4 h-4" />}   color="text-green-500"   accent="border-l-green-400" />
                        <StatCard label="Processing"       value={stats.pending_count}                 sub={toUsd(stats.pending_points)}            icon={<Clock className="w-4 h-4" />}        color="text-amber-500"   accent="border-l-amber-400" />
                        <StatCard label="Completed"        value={stats.total_completed}               icon={<CheckCircle2 className="w-4 h-4" />}  color="text-emerald-500" accent="border-l-emerald-400" />
                    </div>
                </div>

                {/* Time Periods */}
                <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 px-1">By Period</p>
                    <div className="grid grid-cols-2 gap-3">
                        <StatCard label="Today"      value={stats.today_count}     sub={`${toUsd(stats.today_points)} · ${stats.today_completed} done`} icon={<CalendarDays className="w-4 h-4" />} color="text-blue-500"   accent="border-l-blue-300" />
                        <StatCard label="Yesterday"  value={stats.yesterday_count} sub={toUsd(stats.yesterday_points)}  icon={<CalendarDays className="w-4 h-4" />} color="text-gray-500"   accent="border-l-gray-300" />
                        <StatCard label="This Week"  value={stats.week_count}      sub={toUsd(stats.week_points)}       icon={<TrendingUp className="w-4 h-4" />}   color="text-indigo-500" accent="border-l-indigo-400" />
                        <StatCard label="This Month" value={stats.month_count}     sub={toUsd(stats.month_points)}      icon={<TrendingUp className="w-4 h-4" />}   color="text-purple-500" accent="border-l-purple-400" />
                    </div>
                </div>

                {/* Issues */}
                <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 px-1">Issues</p>
                    <div className="grid grid-cols-2 gap-3">
                        <StatCard label="Rejected" value={stats.total_rejected} icon={<XCircle className="w-4 h-4" />}       color="text-red-500"    accent="border-l-red-400" />
                        <StatCard label="Failed"   value={stats.total_failed}   icon={<AlertTriangle className="w-4 h-4" />} color="text-orange-500" accent="border-l-orange-400" />
                    </div>
                </div>

                {/* By Method */}
                {stats.by_method && stats.by_method.length > 0 && (
                    <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 px-1">By Method</p>
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
                            {stats.by_method.map((m) => (
                                <div key={m.method_key} className="flex items-center justify-between px-4 py-3">
                                    <span className="font-medium text-sm text-gray-800">{m.display_name}</span>
                                    <div className="flex items-center gap-3 text-right">
                                        <span className="text-xs text-gray-400">{m.count.toLocaleString()} req</span>
                                        <span className="text-sm font-bold text-gray-900 font-mono">{toUsd(m.total_points)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* By Status */}
                {stats.by_status && stats.by_status.length > 0 && (
                    <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 px-1">By Status</p>
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
                            {stats.by_status.map((s) => {
                                const cfg = STATUS_CONFIG[s.status];
                                return (
                                    <div key={s.status} className="flex items-center justify-between px-4 py-3">
                                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg?.bg ?? "bg-gray-100"} ${cfg?.text ?? "text-gray-600"}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${cfg?.dot ?? "bg-gray-400"}`} />
                                            {cfg?.label ?? s.status}
                                        </span>
                                        <div className="flex items-center gap-3 text-right">
                                            <span className="text-xs text-gray-400">{s.count.toLocaleString()}</span>
                                            <span className="text-sm font-bold text-gray-900 font-mono">{toUsd(s.total_points)}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // ── Render: Withdrawal Card (Mobile-First) ──
    const renderWithdrawalCard = (w: Withdrawal, showActions: boolean) => {
        const cfg = STATUS_CONFIG[w.status] ?? STATUS_CONFIG.pending;
        const destDisplay = w.destination_plain || w.destination_masked;
        const isProcessing = w.status === "processing";
        const methodKey = (w.method_key ?? w.method?.method_key ?? "").toLowerCase();
        const methodBorderColor: Record<string, string> = {
            paypal:   "border-l-[#283593]",
            binance:  "border-l-[#F0B90B]",
            coinbase: "border-l-[#0052FF]",
        };
        const borderColor = methodBorderColor[methodKey] ?? cfg.border;

        return (
            <div
                key={w.id}
                className={`bg-white rounded-2xl border border-gray-100 shadow-sm border-l-4 ${borderColor} overflow-hidden`}
            >
                {/* Card Header */}
                <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        {w.method?.logo_url ? (
                            <img
                                src={w.method.logo_url}
                                alt={w.method.display_name}
                                className="w-9 h-9 rounded-xl object-contain border border-gray-100 p-1 bg-gray-50 shrink-0"
                            />
                        ) : (
                            <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                                <Wallet className="w-4 h-4 text-gray-400" />
                            </div>
                        )}
                        <div className="min-w-0">
                            <p className="font-semibold text-gray-900 text-sm leading-tight truncate">
                                {w.method?.display_name ?? w.method_key}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                                {w.destination_type}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className="text-lg font-bold text-gray-900 leading-tight">
                            {toUsd(w.amount_points)}
                        </span>
                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                            {cfg.label}
                        </span>
                    </div>
                </div>

                {/* Destination Row */}
                <div className="px-4 pb-2">
                    <div className="flex items-center justify-between gap-2 bg-gray-50 rounded-xl px-3 py-2">
                        <span className="font-mono text-xs text-gray-700 truncate flex-1">{destDisplay}</span>
                        <button
                            onClick={(e) => { e.stopPropagation(); copyToClipboard(destDisplay, w.id); }}
                            aria-label="Copy destination"
                            className="shrink-0 p-1.5 hover:bg-white rounded-lg transition-colors border border-gray-200 bg-white"
                        >
                            {copiedId === w.id
                                ? <Check className="w-3.5 h-3.5 text-emerald-500" />
                                : <Copy className="w-3.5 h-3.5 text-gray-400" />
                            }
                        </button>
                    </div>
                </div>

                {/* Meta Row */}
                <div className="px-4 pb-3 flex items-center justify-between gap-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" />
                        {new Date(w.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}{" "}
                        <span className="text-gray-300">·</span>{" "}
                        {new Date(w.created_at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {w.user ? (
                        <Link
                            href={`/admin/keepplay-engine/users/${w.user.id}`}
                            className="flex items-center gap-1 truncate max-w-[45%] hover:text-blue-600 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <User className="w-3 h-3 shrink-0" />
                            <span className="truncate underline decoration-dotted underline-offset-2">
                                {w.user.user_profile?.display_name
                                    ? `${w.user.user_profile.display_name} · ${w.user.ad_id.slice(0, 8)}`
                                    : w.user.ad_id.slice(0, 8)}
                            </span>
                        </Link>
                    ) : (
                        <span className="flex items-center gap-1 text-gray-400">
                            <User className="w-3 h-3 shrink-0" /> —
                        </span>
                    )}
                </div>

                {/* Balance Row */}
                <div className="px-4 pb-3">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-gray-50 rounded-xl px-3 py-2">
                        <Wallet className="w-3 h-3 shrink-0" />
                        <span className="font-mono">{toUsd(w.balance_before)}</span>
                        <ArrowRight className="w-3 h-3 text-gray-300 shrink-0" />
                        <span className="font-mono text-gray-600">{toUsd(w.balance_after)}</span>
                    </div>
                </div>

                {/* Actions */}
                {showActions && isProcessing && (
                    <div className="px-4 pb-4 space-y-2">
                        {methodKey === "paypal" && (
                            <button
                                onClick={(e) => { e.stopPropagation(); addToPayoutList(w); }}
                                disabled={payoutList.some(p => p.withdrawalId === w.id)}
                                className={`w-full flex items-center justify-center gap-1.5 text-sm font-semibold h-9 rounded-xl transition-colors ${
                                    payoutList.some(p => p.withdrawalId === w.id)
                                        ? "bg-gray-100 text-gray-400 cursor-default"
                                        : "bg-[#283593] hover:bg-[#1a237e] active:bg-[#0d1642] text-white"
                                }`}
                            >
                                {payoutList.some(p => p.withdrawalId === w.id)
                                    ? <><Check className="w-4 h-4" /> Added to Payout</>
                                    : <><Plus className="w-4 h-4" /> Add to Payout</>
                                }
                            </button>
                        )}
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={(e) => { e.stopPropagation(); openActionDialog(w, "completed"); }}
                                aria-label="Approve withdrawal"
                                className="flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white text-sm font-semibold h-10 rounded-xl transition-colors"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                Approve
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); openActionDialog(w, "rejected"); }}
                                aria-label="Reject withdrawal"
                                className="flex items-center justify-center gap-1.5 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white text-sm font-semibold h-10 rounded-xl transition-colors"
                            >
                                <XCircle className="w-4 h-4" />
                                Reject
                            </button>
                        </div>
                    </div>
                )}
                {(!showActions || !isProcessing) && w.processed_at && (
                    <div className="px-4 pb-3">
                        <p className="text-[11px] text-gray-400 text-right">
                            Processed {new Date(w.processed_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                    </div>
                )}
            </div>
        );
    };

    // ── Render: Withdrawal List (Cards on mobile, Table on desktop) ──
    const SORT_OPTIONS = [
        { value: "newest",     label: "Newest first",     icon: CalendarDays },
        { value: "oldest",     label: "Oldest first",     icon: CalendarDays },
        { value: "amount_high", label: "Amount: High → Low", icon: DollarSign },
        { value: "amount_low",  label: "Amount: Low → High", icon: DollarSign },
    ];

    const renderWithdrawalList = (showActions: boolean) => {
        const filtered = showActions && methodFilter !== "all"
            ? withdrawals.filter((w) => (w.method_key ?? "").toLowerCase() === methodFilter)
            : [...withdrawals];

        // Apply sorting
        if (sortBy === "oldest") {
            filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        } else if (sortBy === "amount_high") {
            filtered.sort((a, b) => b.amount_points - a.amount_points);
        } else if (sortBy === "amount_low") {
            filtered.sort((a, b) => a.amount_points - b.amount_points);
        }
        // "newest" is the default API order — no re-sort needed

        const displayWithdrawals = filtered;
        return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="space-y-3">
                {/* Search + Sort + Refresh */}
                <div className="flex gap-2">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search…"
                            className="pl-9 h-9 rounded-xl border-gray-200 bg-white text-sm"
                        />
                    </div>
                    {/* Sort / Filter Button */}
                    <div className="relative">
                        <button
                            onClick={() => setShowSortMenu((v) => !v)}
                            className={`h-9 flex items-center gap-1.5 px-3 border rounded-xl text-xs font-medium transition-colors shrink-0 ${
                                sortBy !== "newest"
                                    ? "bg-gray-900 text-white border-gray-900"
                                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                            }`}
                            title="Sort & Filter"
                        >
                            <ArrowUpDown className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">{SORT_OPTIONS.find(s => s.value === sortBy)?.label ?? "Sort"}</span>
                            <ChevronDown className={`w-3 h-3 transition-transform ${showSortMenu ? "rotate-180" : ""}`} />
                        </button>
                        {showSortMenu && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowSortMenu(false)} />
                                <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-lg min-w-[180px] py-1 overflow-hidden">
                                    {SORT_OPTIONS.map((opt) => {
                                        const Icon = opt.icon;
                                        const isActive = sortBy === opt.value;
                                        return (
                                            <button
                                                key={opt.value}
                                                onClick={() => { setSortBy(opt.value); setShowSortMenu(false); }}
                                                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors ${
                                                    isActive
                                                        ? "bg-gray-900 text-white font-semibold"
                                                        : "text-gray-700 hover:bg-gray-50 font-medium"
                                                }`}
                                            >
                                                <Icon className="w-3.5 h-3.5" />
                                                {opt.label}
                                                {isActive && <Check className="w-3.5 h-3.5 ml-auto" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>
                    <button
                        onClick={() => { fetchWithdrawals(); fetchStats(); }}
                        className="w-9 h-9 flex items-center justify-center bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shrink-0"
                        title="Refresh"
                    >
                        <RefreshCw className="w-4 h-4 text-gray-500" />
                    </button>
                </div>

                {/* Status Filter Pills — All Withdrawals tab */}
                {!showActions && (
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
                        {STATUS_FILTERS.map((f) => {
                            const cfg = STATUS_CONFIG[f.value];
                            const isActive = statusFilter === f.value;
                            return (
                                <button
                                    key={f.value}
                                    onClick={() => setStatusFilter(f.value)}
                                    className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors whitespace-nowrap ${
                                        isActive
                                            ? "bg-gray-900 text-white border-gray-900"
                                            : `bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50`
                                    }`}
                                >
                                    {f.value !== "all" && cfg && (
                                        <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${isActive ? "bg-white" : cfg.dot}`} />
                                    )}
                                    {f.label}
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Method Filter Pills — Pending tab */}
                {showActions && (
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
                        {([
                            { value: "all",      label: "All",      bg: "bg-gray-900",      border: "border-gray-900",      text: "text-white" },
                            { value: "paypal",   label: "PayPal",   bg: "bg-[#283593]",    border: "border-[#283593]",    text: "text-white" },
                            { value: "binance",  label: "Binance",  bg: "bg-[#F0B90B]",    border: "border-[#F0B90B]",    text: "text-gray-900" },
                            { value: "coinbase", label: "Coinbase", bg: "bg-[#0052FF]",    border: "border-[#0052FF]",    text: "text-white" },
                        ] as const).map((m) => {
                            const isActive = methodFilter === m.value;
                            return (
                                <button
                                    key={m.value}
                                    onClick={() => {
                                        setMethodFilter(m.value);
                                        if (m.value === "all") {
                                            router.push(`${BASE}/pending`);
                                        } else {
                                            router.push(`${BASE}/pending/${m.value}`);
                                        }
                                    }}
                                    className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors whitespace-nowrap ${
                                        isActive
                                            ? `${m.bg} ${m.border} ${m.text}`
                                            : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                    }`}
                                >
                                    {m.label}
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* PayPal Payout CSV Builder */}
                {showActions && payoutList.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#283593]/5 border-2 border-[#283593]/20 rounded-2xl px-4 py-3">
                        <div className="flex items-center gap-2.5 text-sm">
                            <div className="p-2 bg-[#283593]/10 rounded-xl">
                                <Download className="w-5 h-5 text-[#283593]" />
                            </div>
                            <div>
                                <p className="font-bold text-[#283593] text-sm">
                                    {payoutList.length} recipient{payoutList.length !== 1 ? "s" : ""} in payout
                                </p>
                                <p className="text-xs text-gray-500 font-mono">
                                    Total: ${payoutList.reduce((sum, p) => sum + (conversionRate != null ? p.amountPoints * conversionRate : p.amountPoints), 0).toFixed(2)} USD
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <button
                                onClick={() => setPayoutList([])}
                                className="text-xs text-gray-500 hover:text-red-600 transition-colors px-3 py-2 rounded-lg hover:bg-red-50"
                            >
                                Clear all
                            </button>
                            <button
                                onClick={downloadPayoutCsv}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#283593] hover:bg-[#1a237e] text-white text-sm font-bold h-11 px-6 rounded-xl transition-colors shadow-sm"
                            >
                                <Download className="w-4 h-4" />
                                Download CSV
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700">
                    <p className="font-medium text-sm">Error loading withdrawals</p>
                    <p className="text-xs mt-1">{error}</p>
                    <Button variant="outline" size="sm" className="mt-2" onClick={fetchWithdrawals}>Retry</Button>
                </div>
            )}

            {/* ── Mobile Cards ── */}
            <div className="block lg:hidden space-y-3">
                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="w-9 h-9 rounded-xl" />
                                    <div className="space-y-1.5">
                                        <Skeleton className="h-4 w-20 rounded" />
                                        <Skeleton className="h-3 w-12 rounded" />
                                    </div>
                                </div>
                                <div className="space-y-1.5 text-right">
                                    <Skeleton className="h-5 w-16 rounded ml-auto" />
                                    <Skeleton className="h-4 w-20 rounded ml-auto" />
                                </div>
                            </div>
                            <Skeleton className="h-9 w-full rounded-xl" />
                            <div className="flex justify-between">
                                <Skeleton className="h-3 w-24 rounded" />
                                <Skeleton className="h-3 w-24 rounded" />
                            </div>
                            {showActions && (
                                <div className="grid grid-cols-2 gap-2 pt-1">
                                    <Skeleton className="h-10 rounded-xl" />
                                    <Skeleton className="h-10 rounded-xl" />
                                </div>
                            )}
                        </div>
                    ))
                ) : displayWithdrawals.length ? (
                    displayWithdrawals.map((w) => renderWithdrawalCard(w, showActions))
                ) : (
                    <div className="bg-white rounded-2xl border border-gray-100 py-12 text-center text-gray-400">
                        <Wallet className="w-8 h-8 mx-auto mb-3 opacity-30" />
                        <p className="text-sm font-medium">No withdrawals found</p>
                    </div>
                )}
            </div>

            {/* ── Desktop Table ── */}
            <div className="hidden lg:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50">
                                <TableHead className="min-w-[130px] font-semibold text-gray-600">Date</TableHead>
                                <TableHead className="font-semibold text-gray-600">Status</TableHead>
                                <TableHead className="text-right font-semibold text-gray-600">Amount</TableHead>
                                <TableHead className="font-semibold text-gray-600">Method</TableHead>
                                <TableHead className="font-semibold text-gray-600">Destination</TableHead>
                                <TableHead className="font-semibold text-gray-600">User</TableHead>
                                <TableHead className="text-right font-semibold text-gray-600">Balance</TableHead>
                                <TableHead className="min-w-[150px] font-semibold text-gray-600">
                                    {showActions ? "Actions" : "Processed"}
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        {Array.from({ length: 8 }).map((_, j) => (
                                            <TableCell key={j}><Skeleton className="h-4 w-full rounded" /></TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : displayWithdrawals.length ? (
                                displayWithdrawals.map((w) => {
                                    const cfg = STATUS_CONFIG[w.status] ?? STATUS_CONFIG.pending;
                                    const destDisplay = w.destination_plain || w.destination_masked;
                                    return (
                                        <TableRow key={w.id} className="hover:bg-gray-50/50 transition-colors">
                                            <TableCell className="text-sm">
                                                {new Date(w.created_at).toLocaleDateString()}{" "}
                                                <span className="text-gray-400">{new Date(w.created_at).toLocaleTimeString()}</span>
                                            </TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                                    {cfg.label}
                                                </span>
                                            </TableCell>
                                            <TableCell className="font-mono text-right font-semibold">
                                                <span className="inline-flex items-center gap-1">
                                                    <DollarSign className="w-3.5 h-3.5 text-green-500" />
                                                    {toUsd(w.amount_points)}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm font-medium">{w.method?.display_name ?? w.method_key}</span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-mono text-gray-700">{destDisplay}</span>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); copyToClipboard(destDisplay, w.id); }}
                                                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                                                    >
                                                        {copiedId === w.id
                                                            ? <Check className="w-3.5 h-3.5 text-emerald-500" />
                                                            : <Copy className="w-3.5 h-3.5 text-gray-400" />
                                                        }
                                                    </button>
                                                </div>
                                                <span className="text-xs text-gray-400">{w.destination_type}</span>
                                            </TableCell>
                                            <TableCell>
                                                {w.user ? (
                                                    <Link
                                                        href={`/admin/keepplay-engine/users/${w.user.id}`}
                                                        className="inline-flex items-center gap-1.5 text-xs text-gray-700 hover:text-blue-600 transition-colors group"
                                                    >
                                                        <span className="font-medium group-hover:underline">
                                                            {w.user.user_profile?.display_name ?? ""}
                                                        </span>
                                                        <span className="font-mono text-gray-400 group-hover:text-blue-400">
                                                            {w.user.ad_id.slice(0, 8)}
                                                        </span>
                                                    </Link>
                                                ) : (
                                                    <span className="text-xs text-gray-400">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right text-xs font-mono text-gray-500">
                                                <div><span className="text-gray-400">Before:</span> {toUsd(w.balance_before)}</div>
                                                <div><span className="text-gray-400">After:</span> {toUsd(w.balance_after)}</div>
                                            </TableCell>
                                            <TableCell>
                                                {showActions && w.status === "processing" ? (
                                                    <div className="flex items-center gap-1.5">
                                                        {(w.method_key ?? "").toLowerCase() === "paypal" && (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); addToPayoutList(w); }}
                                                                disabled={payoutList.some(p => p.withdrawalId === w.id)}
                                                                className={`flex items-center gap-1 text-xs font-semibold h-7 px-2.5 rounded-lg transition-colors ${
                                                                    payoutList.some(p => p.withdrawalId === w.id)
                                                                        ? "bg-gray-100 text-gray-400 cursor-default"
                                                                        : "bg-[#283593] hover:bg-[#1a237e] text-white"
                                                                }`}
                                                            >
                                                                {payoutList.some(p => p.withdrawalId === w.id)
                                                                    ? <><Check className="w-3 h-3" /> Added</>
                                                                    : <><Plus className="w-3 h-3" /> Add</>
                                                                }
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); openActionDialog(w, "completed"); }}
                                                            className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold h-7 px-2.5 rounded-lg transition-colors"
                                                        >
                                                            <CheckCircle2 className="w-3 h-3" /> Approve
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); openActionDialog(w, "rejected"); }}
                                                            className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold h-7 px-2.5 rounded-lg transition-colors"
                                                        >
                                                            <XCircle className="w-3 h-3" /> Reject
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400">
                                                        {w.processed_at ? new Date(w.processed_at).toLocaleDateString() : "—"}
                                                    </span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-12 text-gray-400">
                                        <Wallet className="w-7 h-7 mx-auto mb-2 opacity-30" />
                                        <p className="text-sm">No withdrawals found</p>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
                        <p className="text-xs text-gray-500">
                            {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of {total.toLocaleString()}
                        </p>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" disabled={offset === 0}
                                onClick={() => setOffset((p) => Math.max(0, p - PAGE_SIZE))}
                                className="h-8 w-8 p-0 rounded-lg"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <span className="text-xs font-medium text-gray-700 px-1">{currentPage} / {totalPages}</span>
                            <Button variant="outline" size="sm" disabled={offset + PAGE_SIZE >= total}
                                onClick={() => setOffset((p) => p + PAGE_SIZE)}
                                className="h-8 w-8 p-0 rounded-lg"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Mobile Pagination */}
            {totalPages > 1 && (
                <div className="flex lg:hidden items-center justify-between px-1">
                    <p className="text-xs text-gray-500">
                        {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of {total.toLocaleString()}
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            aria-label="Previous page"
                            disabled={offset === 0}
                            onClick={() => setOffset((p) => Math.max(0, p - PAGE_SIZE))}
                            className="w-9 h-9 flex items-center justify-center bg-white border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50 transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-xs font-semibold text-gray-700">{currentPage} / {totalPages}</span>
                        <button
                            aria-label="Next page"
                            disabled={offset + PAGE_SIZE >= total}
                            onClick={() => setOffset((p) => p + PAGE_SIZE)}
                            className="w-9 h-9 flex items-center justify-center bg-white border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50 transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
    };

    return (
        <div className="max-w-7xl mx-auto space-y-5">
            <Tabs value={tab} onValueChange={(v) => {
                setTab(v);
                if (v === "dashboard") {
                    router.push(`${BASE}/dashboard`);
                } else if (v === "requests") {
                    setStatusFilter("processing");
                    setMethodFilter("all");
                    setOffset(0);
                    router.push(`${BASE}/pending`);
                } else if (v === "all") {
                    setStatusFilter("all");
                    setOffset(0);
                    router.push(`${BASE}/all`);
                }
            }}>
                {/* ── Tab Bar ── */}
                <TabsList className="h-auto p-1 bg-white border border-gray-200 rounded-2xl shadow-sm gap-1 w-full sm:w-auto">
                    <TabsTrigger
                        value="dashboard"
                        className="flex-1 sm:flex-none text-xs sm:text-sm rounded-xl py-2 px-3 font-medium data-[state=active]:bg-gray-900 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
                    >
                        Dashboard
                    </TabsTrigger>
                    <TabsTrigger
                        value="requests"
                        className="flex-1 sm:flex-none text-xs sm:text-sm rounded-xl py-2 px-3 font-medium data-[state=active]:bg-gray-900 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all relative"
                    >
                        Pending
                        {stats && stats.pending_count > 0 && (
                            <span className="ml-1.5 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500 text-white min-w-[18px] leading-none">
                                {stats.pending_count}
                            </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger
                        value="all"
                        className="flex-1 sm:flex-none text-xs sm:text-sm rounded-xl py-2 px-3 font-medium data-[state=active]:bg-gray-900 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
                    >
                        All
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="dashboard" className="mt-5">
                    {renderDashboard()}
                </TabsContent>

                <TabsContent value="requests" className="mt-5">
                    {renderWithdrawalList(true)}
                </TabsContent>

                <TabsContent value="all" className="mt-5">
                    {renderWithdrawalList(false)}
                </TabsContent>
            </Tabs>

            {/* ── Approve / Reject Confirmation Dialog ── */}
            <Dialog open={actionDialog.open} onOpenChange={(open) => {
                if (!open) setActionDialog({ open: false, withdrawal: null, action: "completed" });
            }}>
                <DialogContent className="w-[calc(100vw-2rem)] max-w-md rounded-2xl sm:rounded-2xl mx-auto p-0 overflow-hidden border-0 shadow-2xl">
                    {/* Dialog Header */}
                    <div className={`px-5 pt-5 pb-4 ${actionDialog.action === "completed" ? "bg-emerald-50" : "bg-red-50"}`}>
                        <DialogHeader>
                            <DialogTitle className={`text-base font-bold ${actionDialog.action === "completed" ? "text-emerald-800" : "text-red-800"}`}>
                                <span className="flex items-center gap-2">
                                    {actionDialog.action === "completed"
                                        ? <><CheckCircle2 className="w-5 h-5 text-emerald-600" /> Approve Withdrawal</>
                                        : <><XCircle className="w-5 h-5 text-red-600" /> Reject Withdrawal</>
                                    }
                                </span>
                            </DialogTitle>
                            <DialogDescription className={`text-xs mt-1 ${actionDialog.action === "completed" ? "text-emerald-700" : "text-red-700"}`}>
                                {actionDialog.action === "completed"
                                    ? "Confirm you have sent the payment to the user."
                                    : "This will reject the withdrawal request."
                                }
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="px-5 py-4 space-y-4">
                        {actionDialog.withdrawal && (
                            <>
                                {/* Summary */}
                                <div className="bg-gray-50 rounded-xl divide-y divide-gray-100 overflow-hidden border border-gray-100">
                                    <div className="flex items-center justify-between px-4 py-2.5">
                                        <span className="text-xs text-gray-500 font-medium">Amount</span>
                                        <span className="text-sm font-bold text-gray-900">{toUsd(actionDialog.withdrawal.amount_points)}</span>
                                    </div>
                                    <div className="flex items-center justify-between px-4 py-2.5">
                                        <span className="text-xs text-gray-500 font-medium">Method</span>
                                        <span className="text-sm font-medium text-gray-800">{actionDialog.withdrawal.method?.display_name ?? actionDialog.withdrawal.method_key}</span>
                                    </div>
                                    <div className="flex items-center justify-between px-4 py-2.5 gap-3">
                                        <span className="text-xs text-gray-500 font-medium shrink-0">Destination</span>
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="font-mono text-xs text-gray-800 truncate">
                                                {actionDialog.withdrawal.destination_plain || actionDialog.withdrawal.destination_masked}
                                            </span>
                                            <button
                                                onClick={() => copyToClipboard(
                                                    actionDialog.withdrawal!.destination_plain || actionDialog.withdrawal!.destination_masked,
                                                    `dialog-${actionDialog.withdrawal!.id}`
                                                )}
                                                className="shrink-0 p-1.5 hover:bg-gray-200 rounded-lg transition-colors border border-gray-200 bg-white"
                                            >
                                                {copiedId === `dialog-${actionDialog.withdrawal.id}`
                                                    ? <Check className="w-3.5 h-3.5 text-emerald-500" />
                                                    : <Copy className="w-3.5 h-3.5 text-gray-400" />
                                                }
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between px-4 py-2.5">
                                        <span className="text-xs text-gray-500 font-medium">User</span>
                                        {actionDialog.withdrawal.user ? (
                                            <Link
                                                href={`/admin/keepplay-engine/users/${actionDialog.withdrawal.user.id}`}
                                                className="text-xs text-blue-600 hover:text-blue-800 hover:underline truncate max-w-[60%] transition-colors"
                                            >
                                                {actionDialog.withdrawal.user.user_profile?.display_name
                                                    ? `${actionDialog.withdrawal.user.user_profile.display_name} · ${actionDialog.withdrawal.user.ad_id.slice(0, 8)}`
                                                    : actionDialog.withdrawal.user.ad_id.slice(0, 8)}
                                            </Link>
                                        ) : (
                                            <span className="text-xs text-gray-400">—</span>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between px-4 py-2.5">
                                        <span className="text-xs text-gray-500 font-medium">Requested</span>
                                        <span className="text-xs text-gray-700">{new Date(actionDialog.withdrawal.created_at).toLocaleString()}</span>
                                    </div>
                                </div>

                                {/* Admin Notes */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                        Admin Notes <span className="font-normal text-gray-400">(optional)</span>
                                    </label>
                                    <Input
                                        value={adminNotes}
                                        onChange={(e) => setAdminNotes(e.target.value)}
                                        placeholder={actionDialog.action === "rejected" ? "Reason for rejection…" : "Payment reference, notes…"}
                                        maxLength={500}
                                        className="rounded-xl text-sm h-10 border-gray-200"
                                    />
                                </div>

                                {/* Refund Toggle (Reject only) */}
                                {actionDialog.action === "rejected" && (
                                    <div className="space-y-2.5">
                                        <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                                            <div>
                                                <p className="text-sm font-semibold text-gray-800">Refund points</p>
                                                <p className="text-xs text-gray-500 mt-0.5">Return {toUsd(actionDialog.withdrawal.amount_points)} to wallet</p>
                                            </div>
                                            <button
                                                type="button"
                                                role="switch"
                                                aria-label="Toggle refund points"
                                                aria-checked={refundPoints}
                                                onClick={() => setRefundPoints(!refundPoints)}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${refundPoints ? "bg-emerald-500" : "bg-gray-300"}`}
                                            >
                                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${refundPoints ? "translate-x-6" : "translate-x-1"}`} />
                                            </button>
                                        </div>
                                        <div className={`rounded-xl p-3 text-xs font-medium flex items-start gap-2 ${refundPoints ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                                            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                                            {refundPoints
                                                ? `${toUsd(actionDialog.withdrawal.amount_points)} will be credited back to the user's wallet.`
                                                : `${toUsd(actionDialog.withdrawal.amount_points)} will NOT be returned. User loses these points.`
                                            }
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <DialogFooter className="px-5 pb-5 gap-2 flex-row">
                        <Button
                            variant="outline"
                            onClick={() => setActionDialog({ open: false, withdrawal: null, action: "completed" })}
                            disabled={actionLoading}
                            className="flex-1 h-11 rounded-xl font-semibold border-gray-200"
                        >
                            Cancel
                        </Button>
                        <button
                            onClick={handleAction}
                            disabled={actionLoading}
                            className={`flex-1 h-11 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60 ${
                                actionDialog.action === "completed"
                                    ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                                    : "bg-red-500 hover:bg-red-600 text-white"
                            }`}
                        >
                            {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                            {actionDialog.action === "completed" ? "Confirm Approval" : "Confirm Rejection"}
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* Mobile bottom spacer (~half viewport height) */}
            <div className="h-[50vh] md:hidden" />
        </div>
    );
}
