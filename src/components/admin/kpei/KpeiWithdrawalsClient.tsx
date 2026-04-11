"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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
    User,
    CalendarDays,
    ChevronDown,
    ArrowUpDown,
    Plus,
    Download,
} from "lucide-react";

// ─────────────────────────────────────────────
// Types (matching the new infra schema)
// ─────────────────────────────────────────────

interface KpeiUser {
    id: string;
    display_name: string | null;
    current_ad_id: string;
    fcm_token: string | null;
    country_code: string | null;
    city: string | null;
    created_at: string;
}

interface KpeiWithdrawal {
    id: string;
    user_id: string;
    method: string;
    amount_coins: number;
    amount_usd: string;
    payout_address: string;
    status: string;
    denial_reason: string | null;
    created_at: string;
    processed_at: string | null;
    user: KpeiUser | null;
}

interface KpeiWithdrawalStats {
    success: boolean;
    total_withdrawals: number;
    total_coins_withdrawn: number;
    total_usd_withdrawn: number;
    total_completed: number;
    total_denied: number;
    processing_count: number;
    processing_coins: number;
    processing_usd: number;
    pending_count: number;
    pending_coins: number;
    today_count: number;
    today_coins: number;
    today_usd: number;
    yesterday_count: number;
    yesterday_coins: number;
    week_count: number;
    week_coins: number;
    month_count: number;
    month_coins: number;
    by_method: { method: string; count: number; total_coins: number; total_usd: number }[];
    by_status: { status: string; count: number; total_coins: number; total_usd: number }[];
}

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const PAGE_SIZE = 20;
// Conversion: 1000 coins = $0.01 → 1 coin = $0.00001
const COIN_TO_USD = 0.00001;

const toUsd = (coins: number) => {
    const usd = coins * COIN_TO_USD;
    if (usd < 0.01 && usd > 0) return `$${usd.toFixed(5)}`;
    return `$${usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const STATUS_CONFIG: Record<string, {
    label: string;
    icon: React.ReactNode;
    bg: string;
    text: string;
    dot: string;
}> = {
    pending:    { label: "Pending",    icon: <Clock className="w-3 h-3" />,          bg: "bg-blue-50",    text: "text-blue-700",    dot: "bg-blue-400"    },
    processing: { label: "Processing", icon: <Clock className="w-3 h-3" />,          bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-400"   },
    approved:   { label: "Approved",   icon: <CheckCircle2 className="w-3 h-3" />,   bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400" },
    paid:       { label: "Paid",       icon: <CheckCircle2 className="w-3 h-3" />,   bg: "bg-green-50",   text: "text-green-700",   dot: "bg-green-400"   },
    denied:     { label: "Denied",     icon: <XCircle className="w-3 h-3" />,        bg: "bg-red-50",     text: "text-red-700",     dot: "bg-red-400"     },
};

const STATUS_FILTERS = [
    { value: "all",        label: "All" },
    { value: "processing", label: "Processing" },
    { value: "approved",   label: "Approved" },
    { value: "paid",       label: "Paid" },
    { value: "pending",    label: "Pending" },
    { value: "denied",     label: "Denied" },
];

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

interface KpeiWithdrawalsClientProps {
    initialTab?: string;
    initialMethod?: string;
}

const BASE = "/admin/kpe/withdrawals";

export default function KpeiWithdrawalsClient({
    initialTab = "dashboard",
    initialMethod = "all",
}: KpeiWithdrawalsClientProps) {
    const router = useRouter();

    // ── State ──
    const [tab, setTab] = useState(initialTab);
    const [stats, setStats] = useState<KpeiWithdrawalStats | null>(null);
    const [statsLoading, setStatsLoading] = useState(true);
    const [statsError, setStatsError] = useState<string | null>(null);

    const [withdrawals, setWithdrawals] = useState<KpeiWithdrawal[]>([]);
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
        withdrawal: KpeiWithdrawal | null;
        action: "paid" | "denied";
    }>({ open: false, withdrawal: null, action: "paid" });
    const [denialReason, setDenialReason] = useState("");
    const [refundPoints, setRefundPoints] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Copy state
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // PayPal payout list for CSV export
    const [payoutList, setPayoutList] = useState<{ withdrawalId: string; email: string; amountCoins: number; amountUsd: string }[]>([]);

    // ── PayPal Payout helpers ──
    const addToPayoutList = (w: KpeiWithdrawal) => {
        if (payoutList.some(p => p.withdrawalId === w.id)) return;
        setPayoutList(prev => [...prev, {
            withdrawalId: w.id,
            email: w.payout_address,
            amountCoins: w.amount_coins,
            amountUsd: w.amount_usd,
        }]);
    };

    const removeFromPayoutList = useCallback((withdrawalId: string) => {
        setPayoutList(prev => prev.filter(p => p.withdrawalId !== withdrawalId));
    }, []);
    // expose for potential future use
    void removeFromPayoutList;

    const downloadPayoutCsv = () => {
        if (payoutList.length === 0) return;
        const header = "Email/Phone,Amount,Currency code,Reference ID (optional),Note to recipient,Recipient wallet,Social Feed Privacy (optional),Holler URL (deprecated),Logo URL (optional),Purpose (optional)";
        const rows = payoutList.map(p => {
            const usdAmount = parseFloat(p.amountUsd).toFixed(2);
            return `${p.email},${usdAmount},USD,${p.withdrawalId.slice(0, 8)},KeepPlay ❤️,PayPal,,,,`;
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

    // ── Fetch Stats ──
    const fetchStats = useCallback(async () => {
        setStatsLoading(true);
        setStatsError(null);
        try {
            const res = await fetch("/api/kpei/withdrawals/stats");
            if (!res.ok) throw new Error(`Failed: ${res.status}`);
            const json: KpeiWithdrawalStats = await res.json();
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
            if (methodFilter !== "all") params.set("method", methodFilter);

            const res = await fetch(`/api/kpei/withdrawals?${params.toString()}`);
            if (!res.ok) throw new Error(`Failed: ${res.status}`);
            const json = await res.json();
            setWithdrawals(json.withdrawals ?? []);
            setTotal(json.total ?? 0);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setLoading(false);
        }
    }, [offset, search, statusFilter, methodFilter]);

    useEffect(() => { fetchStats(); }, [fetchStats]);
    useEffect(() => { fetchWithdrawals(); }, [fetchWithdrawals]);
    useEffect(() => { setOffset(0); }, [search, statusFilter, methodFilter]);

    const totalPages = Math.ceil(total / PAGE_SIZE);
    const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

    // ── Handle Approve/Reject ──
    const openActionDialog = (withdrawal: KpeiWithdrawal, action: "paid" | "denied") => {
        setActionDialog({ open: true, withdrawal, action });
        setDenialReason("");
        setRefundPoints(true);
    };

    const handleAction = async () => {
        if (!actionDialog.withdrawal) return;
        setActionLoading(true);
        try {
            const res = await fetch("/api/kpei/withdrawals", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    withdrawal_id: actionDialog.withdrawal.id,
                    new_status: actionDialog.action,
                    denial_reason: actionDialog.action === "denied" ? denialReason || undefined : undefined,
                    ...(actionDialog.action === "denied" && { refund: refundPoints }),
                }),
            });
            const json = await res.json();
            if (!res.ok || !json.success) {
                throw new Error(json.error || "Operation failed");
            }
            setActionDialog({ open: false, withdrawal: null, action: "paid" });
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

    // ── Method colors ──
    const METHOD_COLORS: Record<string, { bg: string; border: string; text: string; pillBg: string }> = {
        paypal:   { bg: "bg-[#283593]",   border: "border-l-[#283593]",   text: "text-white",     pillBg: "bg-[#283593]" },
        binance:  { bg: "bg-[#F0B90B]",   border: "border-l-[#F0B90B]",   text: "text-gray-900",  pillBg: "bg-[#F0B90B]" },
        coinbase: { bg: "bg-[#0052FF]",   border: "border-l-[#0052FF]",   text: "text-white",     pillBg: "bg-[#0052FF]" },
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

        const actionableCount = stats.processing_count + stats.pending_count;

        return (
            <div className="space-y-5">
                {/* Pending Alert */}
                {actionableCount > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-amber-100 rounded-xl shrink-0">
                                <AlertTriangle className="w-4 h-4 text-amber-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-amber-800 text-sm">
                                    {actionableCount} Request{actionableCount !== 1 ? "s" : ""} Need Action
                                </p>
                                <p className="text-xs text-amber-600 mt-0.5">
                                    {toUsd(stats.processing_coins)} awaiting approval
                                </p>
                            </div>
                        </div>
                        <Button
                            size="sm"
                            className="w-full mt-3 bg-amber-500 hover:bg-amber-600 text-white border-0 h-9 rounded-xl font-medium"
                            onClick={() => { setTab("requests"); router.push(`${BASE}/pending`); }}
                        >
                            Review Now →
                        </Button>
                    </div>
                )}

                {/* Overview */}
                <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 px-1">Overview</p>
                    <div className="grid grid-cols-2 gap-3">
                        <StatCard label="Total Requests"   value={stats.total_withdrawals}               icon={<DollarSign className="w-4 h-4" />}   color="text-blue-500"    accent="border-l-blue-400" />
                        <StatCard label="Total Paid Out"   value={`$${Number(stats.total_usd_withdrawn).toFixed(2)}`} sub="All time"  icon={<TrendingUp className="w-4 h-4" />}   color="text-green-500"   accent="border-l-green-400" />
                        <StatCard label="Processing"       value={stats.processing_count}                sub={`$${Number(stats.processing_usd).toFixed(2)}`} icon={<Clock className="w-4 h-4" />} color="text-amber-500" accent="border-l-amber-400" />
                        <StatCard label="Completed"        value={stats.total_completed}                 icon={<CheckCircle2 className="w-4 h-4" />}  color="text-emerald-500" accent="border-l-emerald-400" />
                    </div>
                </div>

                {/* Time Periods */}
                <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 px-1">By Period</p>
                    <div className="grid grid-cols-2 gap-3">
                        <StatCard label="Today"      value={stats.today_count}     sub={`$${Number(stats.today_usd).toFixed(2)}`}   icon={<CalendarDays className="w-4 h-4" />} color="text-blue-500"   accent="border-l-blue-300" />
                        <StatCard label="Yesterday"  value={stats.yesterday_count} sub={toUsd(stats.yesterday_coins)}                icon={<CalendarDays className="w-4 h-4" />} color="text-gray-500"   accent="border-l-gray-300" />
                        <StatCard label="This Week"  value={stats.week_count}      sub={toUsd(stats.week_coins)}                     icon={<TrendingUp className="w-4 h-4" />}   color="text-indigo-500" accent="border-l-indigo-400" />
                        <StatCard label="This Month" value={stats.month_count}     sub={toUsd(stats.month_coins)}                    icon={<TrendingUp className="w-4 h-4" />}   color="text-purple-500" accent="border-l-purple-400" />
                    </div>
                </div>

                {/* Issues */}
                <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 px-1">Issues</p>
                    <div className="grid grid-cols-2 gap-3">
                        <StatCard label="Denied"   value={stats.total_denied}    icon={<XCircle className="w-4 h-4" />} color="text-red-500" accent="border-l-red-400" />
                        <StatCard label="Pending"  value={stats.pending_count}   sub={toUsd(stats.pending_coins)}       icon={<Clock className="w-4 h-4" />}  color="text-blue-500" accent="border-l-blue-400" />
                    </div>
                </div>

                {/* By Method */}
                {stats.by_method && stats.by_method.length > 0 && (
                    <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 px-1">By Method</p>
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
                            {stats.by_method.map((m) => (
                                <div key={m.method} className="flex items-center justify-between px-4 py-3">
                                    <span className="font-medium text-sm text-gray-800 capitalize">{m.method}</span>
                                    <div className="flex items-center gap-3 text-right">
                                        <span className="text-xs text-gray-400">{m.count.toLocaleString()} req</span>
                                        <span className="text-sm font-bold text-gray-900 font-mono">${Number(m.total_usd).toFixed(2)}</span>
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
                                            <span className="text-sm font-bold text-gray-900 font-mono">${Number(s.total_usd).toFixed(2)}</span>
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

    // ── Render: Withdrawal Card (Mobile) ──
    const renderWithdrawalCard = (w: KpeiWithdrawal, showActions: boolean) => {
        const cfg = STATUS_CONFIG[w.status] ?? STATUS_CONFIG.processing;
        const isProcessing = w.status === "processing" || w.status === "pending";
        const mc = METHOD_COLORS[w.method] ?? { border: "border-l-gray-300" };

        return (
            <div
                key={w.id}
                className={`bg-white rounded-2xl border border-gray-100 shadow-sm border-l-4 ${mc.border} overflow-hidden`}
            >
                {/* Card Header */}
                <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${mc.pillBg ?? "bg-gray-200"} ${mc.text ?? "text-gray-800"}`}>
                            {w.method.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <p className="font-semibold text-gray-900 text-sm leading-tight capitalize">
                                {w.method}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5 font-mono truncate">
                                {w.payout_address}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className="text-lg font-bold text-gray-900 leading-tight">
                            ${parseFloat(w.amount_usd).toFixed(2)}
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
                        <span className="font-mono text-xs text-gray-700 truncate flex-1">{w.payout_address}</span>
                        <button
                            onClick={(e) => { e.stopPropagation(); copyToClipboard(w.payout_address, w.id); }}
                            aria-label="Copy address"
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
                        <span className="flex items-center gap-1 truncate max-w-[45%]">
                            <User className="w-3 h-3 shrink-0" />
                            <span className="truncate">
                                {w.user.display_name ?? w.user.current_ad_id.slice(0, 8)}
                            </span>
                        </span>
                    ) : (
                        <span className="flex items-center gap-1 text-gray-400">
                            <User className="w-3 h-3 shrink-0" /> —
                        </span>
                    )}
                </div>

                {/* Coins info */}
                <div className="px-4 pb-3">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-gray-50 rounded-xl px-3 py-2">
                        <Wallet className="w-3 h-3 shrink-0" />
                        <span className="font-mono">{w.amount_coins.toLocaleString()} coins</span>
                        <span className="text-gray-300">→</span>
                        <span className="font-mono text-gray-600">${parseFloat(w.amount_usd).toFixed(2)}</span>
                    </div>
                </div>

                {/* Actions */}
                {showActions && isProcessing && (
                    <div className="px-4 pb-4 space-y-2">
                        {w.method === "paypal" && (
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
                                onClick={(e) => { e.stopPropagation(); openActionDialog(w, "paid"); }}
                                aria-label="Approve withdrawal"
                                className="flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white text-sm font-semibold h-10 rounded-xl transition-colors"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                Approve
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); openActionDialog(w, "denied"); }}
                                aria-label="Deny withdrawal"
                                className="flex items-center justify-center gap-1.5 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white text-sm font-semibold h-10 rounded-xl transition-colors"
                            >
                                <XCircle className="w-4 h-4" />
                                Deny
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
                {w.denial_reason && (
                    <div className="px-4 pb-3">
                        <div className="bg-red-50 rounded-xl px-3 py-2 text-xs text-red-700">
                            <span className="font-semibold">Denial reason:</span> {w.denial_reason}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // ── Sort Options ──
    const SORT_OPTIONS = [
        { value: "newest",      label: "Newest first",     icon: CalendarDays },
        { value: "oldest",      label: "Oldest first",     icon: CalendarDays },
        { value: "amount_high", label: "Amount: High → Low", icon: DollarSign },
        { value: "amount_low",  label: "Amount: Low → High", icon: DollarSign },
    ];

    // ── Render: Withdrawal List ──
    const renderWithdrawalList = (showActions: boolean) => {
        const filtered = [...withdrawals];

        // Apply sorting
        if (sortBy === "oldest") {
            filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        } else if (sortBy === "amount_high") {
            filtered.sort((a, b) => parseFloat(b.amount_usd) - parseFloat(a.amount_usd));
        } else if (sortBy === "amount_low") {
            filtered.sort((a, b) => parseFloat(a.amount_usd) - parseFloat(b.amount_usd));
        }

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
                                placeholder="Search by address or ID…"
                                className="pl-9 h-9 rounded-xl border-gray-200 bg-white text-sm"
                            />
                        </div>
                        <div className="relative">
                            <button
                                onClick={() => setShowSortMenu((v) => !v)}
                                className={`h-9 flex items-center gap-1.5 px-3 border rounded-xl text-xs font-medium transition-colors shrink-0 ${
                                    sortBy !== "newest"
                                        ? "bg-gray-900 text-white border-gray-900"
                                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                }`}
                                title="Sort"
                            >
                                <ArrowUpDown className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">{SORT_OPTIONS.find(s => s.value === sortBy)?.label ?? "Sort"}</span>
                                <ChevronDown className={`w-3 h-3 transition-transform ${showSortMenu ? "rotate-180" : ""}`} />
                            </button>
                            {showSortMenu && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowSortMenu(false)} />
                                    <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-lg min-w-45 py-1 overflow-hidden">
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

                    {/* Status Filter Pills — All tab */}
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
                                                : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
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
                                { value: "all",      label: "All",      bg: "bg-gray-900",   border: "border-gray-900",   text: "text-white" },
                                { value: "paypal",   label: "PayPal",   bg: "bg-[#283593]",  border: "border-[#283593]",  text: "text-white" },
                                { value: "binance",  label: "Binance",  bg: "bg-[#F0B90B]",  border: "border-[#F0B90B]",  text: "text-gray-900" },
                                { value: "coinbase", label: "Coinbase", bg: "bg-[#0052FF]",  border: "border-[#0052FF]",  text: "text-white" },
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
                                        Total: ${payoutList.reduce((sum, p) => sum + parseFloat(p.amountUsd), 0).toFixed(2)} USD
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
                                            <Skeleton className="h-3 w-32 rounded" />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5 text-right">
                                        <Skeleton className="h-5 w-16 rounded ml-auto" />
                                        <Skeleton className="h-4 w-20 rounded ml-auto" />
                                    </div>
                                </div>
                                <Skeleton className="h-9 w-full rounded-xl" />
                            </div>
                        ))
                    ) : filtered.length ? (
                        filtered.map((w) => renderWithdrawalCard(w, showActions))
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
                                    <TableHead className="min-w-32.5 font-semibold text-gray-600">Date</TableHead>
                                    <TableHead className="font-semibold text-gray-600">Status</TableHead>
                                    <TableHead className="text-right font-semibold text-gray-600">Amount (USD)</TableHead>
                                    <TableHead className="text-right font-semibold text-gray-600">Coins</TableHead>
                                    <TableHead className="font-semibold text-gray-600">Method</TableHead>
                                    <TableHead className="font-semibold text-gray-600">Payout Address</TableHead>
                                    <TableHead className="font-semibold text-gray-600">User</TableHead>
                                    <TableHead className="min-w-45 font-semibold text-gray-600">
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
                                ) : filtered.length ? (
                                    filtered.map((w) => {
                                        const cfg = STATUS_CONFIG[w.status] ?? STATUS_CONFIG.processing;
                                        const isProcessing = w.status === "processing" || w.status === "pending";
                                        return (
                                            <TableRow key={w.id} className="hover:bg-gray-50/50 transition-colors">
                                                <TableCell className="text-sm">
                                                    {new Date(w.created_at).toLocaleDateString()}{" "}
                                                    <span className="text-gray-400">{new Date(w.created_at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</span>
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
                                                        {parseFloat(w.amount_usd).toFixed(2)}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right text-xs font-mono text-gray-500">
                                                    {w.amount_coins.toLocaleString()}
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-sm font-medium capitalize">{w.method}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-mono text-gray-700 truncate max-w-50">{w.payout_address}</span>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); copyToClipboard(w.payout_address, w.id); }}
                                                            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                                                        >
                                                            {copiedId === w.id
                                                                ? <Check className="w-3.5 h-3.5 text-emerald-500" />
                                                                : <Copy className="w-3.5 h-3.5 text-gray-400" />
                                                            }
                                                        </button>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {w.user ? (
                                                        <span className="text-xs text-gray-700">
                                                            {w.user.display_name ?? w.user.current_ad_id.slice(0, 12)}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">—</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {showActions && isProcessing ? (
                                                        <div className="flex items-center gap-1.5">
                                                            {w.method === "paypal" && (
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
                                                                onClick={(e) => { e.stopPropagation(); openActionDialog(w, "paid"); }}
                                                                className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold h-7 px-2.5 rounded-lg transition-colors"
                                                            >
                                                                <CheckCircle2 className="w-3 h-3" /> Approve
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); openActionDialog(w, "denied"); }}
                                                                className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold h-7 px-2.5 rounded-lg transition-colors"
                                                            >
                                                                <XCircle className="w-3 h-3" /> Deny
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <span className="text-xs text-gray-400">
                                                                {w.processed_at ? new Date(w.processed_at).toLocaleDateString() : "—"}
                                                            </span>
                                                            {w.denial_reason && (
                                                                <p className="text-xs text-red-500 mt-0.5 truncate max-w-50" title={w.denial_reason}>
                                                                    {w.denial_reason}
                                                                </p>
                                                            )}
                                                        </div>
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

                    {/* Desktop Pagination */}
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
                    setMethodFilter("all");
                    setOffset(0);
                    router.push(`${BASE}/all`);
                }
            }}>
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
                        {stats && (stats.processing_count + stats.pending_count) > 0 && (
                            <span className="ml-1.5 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500 text-white min-w-4.5 leading-none">
                                {stats.processing_count + stats.pending_count}
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

            {/* ── Approve / Deny Confirmation Dialog ── */}
            <Dialog open={actionDialog.open} onOpenChange={(open) => {
                if (!open) setActionDialog({ open: false, withdrawal: null, action: "paid" });
            }}>
                <DialogContent className="w-[calc(100vw-2rem)] max-w-md rounded-2xl sm:rounded-2xl mx-auto p-0 overflow-hidden border-0 shadow-2xl">
                    {/* Dialog Header */}
                    <div className={`px-5 pt-5 pb-4 ${actionDialog.action === "paid" ? "bg-emerald-50" : "bg-red-50"}`}>
                        <DialogHeader>
                            <DialogTitle className={`text-base font-bold ${actionDialog.action === "paid" ? "text-emerald-800" : "text-red-800"}`}>
                                <span className="flex items-center gap-2">
                                    {actionDialog.action === "paid"
                                        ? <><CheckCircle2 className="w-5 h-5 text-emerald-600" /> Approve Withdrawal</>
                                        : <><XCircle className="w-5 h-5 text-red-600" /> Deny Withdrawal</>
                                    }
                                </span>
                            </DialogTitle>
                            <DialogDescription className={`text-xs mt-1 ${actionDialog.action === "paid" ? "text-emerald-700" : "text-red-700"}`}>
                                {actionDialog.action === "paid"
                                    ? "Confirm you have sent the payment to the user."
                                    : "This will deny the withdrawal request."
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
                                        <span className="text-sm font-bold text-gray-900">${parseFloat(actionDialog.withdrawal.amount_usd).toFixed(2)}</span>
                                    </div>
                                    <div className="flex items-center justify-between px-4 py-2.5">
                                        <span className="text-xs text-gray-500 font-medium">Coins</span>
                                        <span className="text-sm font-medium text-gray-800">{actionDialog.withdrawal.amount_coins.toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center justify-between px-4 py-2.5">
                                        <span className="text-xs text-gray-500 font-medium">Method</span>
                                        <span className="text-sm font-medium text-gray-800 capitalize">{actionDialog.withdrawal.method}</span>
                                    </div>
                                    <div className="flex items-center justify-between px-4 py-2.5 gap-3">
                                        <span className="text-xs text-gray-500 font-medium shrink-0">Address</span>
                                        <span className="text-sm font-mono text-gray-800 truncate text-right">{actionDialog.withdrawal.payout_address}</span>
                                    </div>
                                    <div className="flex items-center justify-between px-4 py-2.5">
                                        <span className="text-xs text-gray-500 font-medium">User</span>
                                        <span className="text-sm text-gray-800 truncate">
                                            {actionDialog.withdrawal.user?.display_name ?? actionDialog.withdrawal.user?.current_ad_id.slice(0, 12) ?? "Unknown"}
                                        </span>
                                    </div>
                                </div>

                                {/* Denial Reason */}
                                {actionDialog.action === "denied" && (
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-gray-700">Denial Reason</label>
                                        <Input
                                            value={denialReason}
                                            onChange={(e) => setDenialReason(e.target.value)}
                                            placeholder="Optional reason for denial…"
                                            className="rounded-xl text-sm"
                                        />

                                        {/* Refund Toggle */}
                                        <label className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={refundPoints}
                                                onChange={(e) => setRefundPoints(e.target.checked)}
                                                className="w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                                            />
                                            <div>
                                                <p className="text-xs font-semibold text-amber-800">Refund coins to wallet</p>
                                                <p className="text-[11px] text-amber-600">
                                                    Return {actionDialog.withdrawal.amount_coins.toLocaleString()} coins to user&apos;s balance
                                                </p>
                                            </div>
                                        </label>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <DialogFooter className="px-5 pb-5 pt-0 gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setActionDialog({ open: false, withdrawal: null, action: "paid" })}
                            className="rounded-xl h-10"
                            disabled={actionLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAction}
                            disabled={actionLoading}
                            className={`rounded-xl h-10 font-semibold ${
                                actionDialog.action === "paid"
                                    ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                                    : "bg-red-500 hover:bg-red-600 text-white"
                            }`}
                        >
                            {actionLoading ? (
                                <><Loader2 className="w-4 h-4 animate-spin mr-1" /> Processing…</>
                            ) : actionDialog.action === "paid" ? (
                                <><CheckCircle2 className="w-4 h-4 mr-1" /> Confirm Approval</>
                            ) : (
                                <><XCircle className="w-4 h-4 mr-1" /> Confirm Denial</>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
