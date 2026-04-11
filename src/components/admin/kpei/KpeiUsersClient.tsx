"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
    Users,
    UserCheck,
    ArrowUpDown,
    Wallet,
    MapPin,
    CalendarDays,
    RefreshCw,
    Trash2,
    Loader2,
    AlertTriangle,
    User,
} from "lucide-react";

// ─────────────────────────────────────────────
// Types (matching admin_list_users RPC return)
// ─────────────────────────────────────────────

interface KpeiUserListItem {
    id: string;
    display_name: string | null;
    current_ad_id: string;
    country_code: string | null;
    city: string | null;
    created_at: string;
    wallet_balance: number;
    total_withdrawals: number;
    total_withdrawn_coins: number;
    total_challenges: number;
}

const PAGE_SIZE = 20;
const COIN_TO_USD = 0.00001;

const toUsd = (coins: number) => {
    const usd = coins * COIN_TO_USD;
    if (usd < 0.01 && usd > 0) return `$${usd.toFixed(5)}`;
    return `$${usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export default function KpeiUsersClient() {
    const router = useRouter();
    const abortRef = useRef<AbortController | null>(null);

    // Data
    const [users, setUsers] = useState<KpeiUserListItem[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [sortBy, setSortBy] = useState("created_at");
    const [sortOrder, setSortOrder] = useState("desc");
    const [offset, setOffset] = useState(0);

    // Delete dialog
    const [deleteDialog, setDeleteDialog] = useState<{
        open: boolean;
        user: KpeiUserListItem | null;
    }>({ open: false, user: null });
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Debounce search
    useEffect(() => {
        const t = setTimeout(() => { setDebouncedSearch(search); setOffset(0); }, 400);
        return () => clearTimeout(t);
    }, [search]);

    const fetchUsers = useCallback(async () => {
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                limit: String(PAGE_SIZE),
                offset: String(offset),
                sort_by: sortBy,
                sort_order: sortOrder,
            });
            if (debouncedSearch) params.set("search", debouncedSearch);

            const res = await fetch(`/api/kpei/users?${params.toString()}`, {
                cache: "no-store",
                signal: controller.signal,
            });

            if (!res.ok) throw new Error(`Failed: ${res.status}`);
            const json = await res.json();

            // The RPC returns { success, users, total }
            setUsers(json.users ?? []);
            setTotal(json.total ?? 0);
        } catch (err) {
            if (err instanceof DOMException && err.name === "AbortError") return;
            setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setLoading(false);
        }
    }, [offset, sortBy, sortOrder, debouncedSearch]);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);
    useEffect(() => () => { abortRef.current?.abort(); }, []);

    const totalPages = Math.ceil(total / PAGE_SIZE);
    const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

    const handleSort = (field: string) => {
        setOffset(0);
        if (sortBy === field) {
            setSortOrder(p => p === "asc" ? "desc" : "asc");
        } else {
            setSortBy(field);
            setSortOrder("desc");
        }
    };

    const handleDelete = async () => {
        if (!deleteDialog.user) return;
        setDeleteLoading(true);
        try {
            const res = await fetch("/api/kpei/users", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: deleteDialog.user.id }),
            });
            const json = await res.json();
            if (!res.ok || !json.success) throw new Error(json.error || "Delete failed");
            setDeleteDialog({ open: false, user: null });
            fetchUsers();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to delete user");
        } finally {
            setDeleteLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-5">
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm border-l-4 border-l-blue-400">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Users</span>
                        <Users className="w-4 h-4 text-blue-500" />
                    </div>
                    <p className="text-xl font-bold text-gray-900">{total.toLocaleString()}</p>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm border-l-4 border-l-green-400">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Showing</span>
                        <UserCheck className="w-4 h-4 text-green-500" />
                    </div>
                    <p className="text-xl font-bold text-gray-900">{users.length}</p>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm border-l-4 border-l-gray-300 hidden sm:block">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Page</span>
                        <CalendarDays className="w-4 h-4 text-gray-400" />
                    </div>
                    <p className="text-xl font-bold text-gray-900">{currentPage} / {totalPages || 1}</p>
                </div>
            </div>

            {/* Search + Refresh */}
            <div className="flex gap-2">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name, ad ID, or country…"
                        className="pl-9 h-9 rounded-xl border-gray-200 bg-white text-sm"
                    />
                </div>
                <button
                    onClick={fetchUsers}
                    className="w-9 h-9 flex items-center justify-center bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shrink-0"
                    title="Refresh"
                >
                    <RefreshCw className="w-4 h-4 text-gray-500" />
                </button>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700">
                    <p className="font-medium text-sm">Error loading users</p>
                    <p className="text-xs mt-1">{error}</p>
                    <Button variant="outline" size="sm" className="mt-2" onClick={fetchUsers}>Retry</Button>
                </div>
            )}

            {/* ── Mobile Cards ── */}
            <div className="block lg:hidden space-y-3">
                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-2">
                            <div className="flex items-center gap-3">
                                <Skeleton className="w-10 h-10 rounded-xl" />
                                <div className="space-y-1.5 flex-1">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-3 w-24" />
                                </div>
                            </div>
                        </div>
                    ))
                ) : users.length ? (
                    users.map((u) => (
                        <div
                            key={u.id}
                            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden cursor-pointer active:bg-gray-50 transition-colors"
                            onClick={() => router.push(`/admin/kpe/users/${u.id}`)}
                        >
                            <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                                        {(u.display_name ?? u.current_ad_id).slice(0, 2).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-semibold text-gray-900 text-sm truncate">
                                            {u.display_name ?? "No Name"}
                                        </p>
                                        <p className="text-xs text-gray-400 font-mono truncate">
                                            {u.current_ad_id.slice(0, 16)}…
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Details */}
                            <div className="px-4 pb-3 grid grid-cols-2 gap-2">
                                <div className="bg-gray-50 rounded-xl px-3 py-2">
                                    <p className="text-[10px] text-gray-400 uppercase font-semibold">Balance</p>
                                    <div className="flex items-center gap-1 mt-0.5">
                                        <Wallet className="w-3 h-3 text-amber-500" />
                                        <span className="text-sm font-bold text-gray-900 font-mono">{u.wallet_balance.toLocaleString()}</span>
                                    </div>
                                    <p className="text-[10px] text-gray-400 font-mono">{toUsd(u.wallet_balance)}</p>
                                </div>
                                <div className="bg-gray-50 rounded-xl px-3 py-2">
                                    <p className="text-[10px] text-gray-400 uppercase font-semibold">Withdrawals</p>
                                    <span className="text-sm font-bold text-gray-900">{u.total_withdrawals}</span>
                                    <p className="text-[10px] text-gray-400 font-mono">{toUsd(u.total_withdrawn_coins)}</p>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-4 pb-3 flex items-center justify-between text-xs text-gray-400">
                                {u.country_code && (
                                    <span className="flex items-center gap-1">
                                        <MapPin className="w-3 h-3" />
                                        {u.country_code}{u.city ? `, ${u.city}` : ""}
                                    </span>
                                )}
                                <span className="flex items-center gap-1">
                                    <CalendarDays className="w-3 h-3" />
                                    {new Date(u.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                                </span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="bg-white rounded-2xl border border-gray-100 py-12 text-center text-gray-400">
                        <User className="w-8 h-8 mx-auto mb-3 opacity-30" />
                        <p className="text-sm font-medium">No users found</p>
                    </div>
                )}
            </div>

            {/* ── Desktop Table ── */}
            <div className="hidden lg:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50">
                            <TableHead className="min-w-40">
                                <button onClick={() => handleSort("display_name")} className="flex items-center gap-1 hover:text-gray-900 font-semibold text-gray-600">
                                    User <ArrowUpDown className="w-3 h-3" />
                                </button>
                            </TableHead>
                            <TableHead className="font-semibold text-gray-600">Ad ID</TableHead>
                            <TableHead className="font-semibold text-gray-600">Location</TableHead>
                            <TableHead className="text-right">
                                <button onClick={() => handleSort("wallet_balance")} className="flex items-center gap-1 ml-auto hover:text-gray-900 font-semibold text-gray-600">
                                    Balance <ArrowUpDown className="w-3 h-3" />
                                </button>
                            </TableHead>
                            <TableHead className="text-right font-semibold text-gray-600">Withdrawals</TableHead>
                            <TableHead className="text-right font-semibold text-gray-600">Challenges</TableHead>
                            <TableHead>
                                <button onClick={() => handleSort("created_at")} className="flex items-center gap-1 hover:text-gray-900 font-semibold text-gray-600">
                                    Joined <ArrowUpDown className="w-3 h-3" />
                                </button>
                            </TableHead>
                            <TableHead className="w-12" />
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
                        ) : users.length ? (
                            users.map((u) => (
                                <TableRow
                                    key={u.id}
                                    className="cursor-pointer hover:bg-gray-50/50 transition-colors"
                                    onClick={() => router.push(`/admin/kpe/users/${u.id}`)}
                                >
                                    <TableCell>
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                                                {(u.display_name ?? u.current_ad_id).slice(0, 2).toUpperCase()}
                                            </div>
                                            <span className="font-medium text-sm text-gray-900 truncate max-w-40">
                                                {u.display_name ?? "No Name"}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-mono text-xs text-gray-500 truncate max-w-40">
                                        {u.current_ad_id.length > 20 ? `${u.current_ad_id.slice(0, 20)}…` : u.current_ad_id}
                                    </TableCell>
                                    <TableCell className="text-sm text-gray-600">
                                        {u.country_code ? `${u.country_code}${u.city ? ` · ${u.city}` : ""}` : "—"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <span className="font-mono text-sm font-semibold">{u.wallet_balance.toLocaleString()}</span>
                                        <span className="block text-[10px] text-gray-400 font-mono">{toUsd(u.wallet_balance)}</span>
                                    </TableCell>
                                    <TableCell className="text-right text-sm">{u.total_withdrawals}</TableCell>
                                    <TableCell className="text-right text-sm">{u.total_challenges}</TableCell>
                                    <TableCell className="text-sm text-gray-500">
                                        {new Date(u.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                                    </TableCell>
                                    <TableCell>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDeleteDialog({ open: true, user: u });
                                            }}
                                            className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-gray-400 hover:text-red-500"
                                            title="Delete user"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-12 text-gray-400">
                                    <User className="w-7 h-7 mx-auto mb-2 opacity-30" />
                                    <p className="text-sm">No users found</p>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
                        <p className="text-xs text-gray-500">
                            {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of {total.toLocaleString()}
                        </p>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" disabled={offset === 0}
                                onClick={() => setOffset(p => Math.max(0, p - PAGE_SIZE))}
                                className="h-8 w-8 p-0 rounded-lg"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <span className="text-xs font-medium text-gray-700">{currentPage} / {totalPages}</span>
                            <Button variant="outline" size="sm" disabled={offset + PAGE_SIZE >= total}
                                onClick={() => setOffset(p => p + PAGE_SIZE)}
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
                        <button disabled={offset === 0} onClick={() => setOffset(p => Math.max(0, p - PAGE_SIZE))} title="Previous page"
                            className="w-9 h-9 flex items-center justify-center bg-white border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-xs font-semibold text-gray-700">{currentPage} / {totalPages}</span>
                        <button disabled={offset + PAGE_SIZE >= total} onClick={() => setOffset(p => p + PAGE_SIZE)} title="Next page"
                            className="w-9 h-9 flex items-center justify-center bg-white border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* ── Delete Confirmation Dialog ── */}
            <Dialog open={deleteDialog.open} onOpenChange={(open) => {
                if (!open) setDeleteDialog({ open: false, user: null });
            }}>
                <DialogContent className="w-[calc(100vw-2rem)] max-w-md rounded-2xl sm:rounded-2xl mx-auto p-0 overflow-hidden border-0 shadow-2xl">
                    <div className="px-5 pt-5 pb-4 bg-red-50">
                        <DialogHeader>
                            <DialogTitle className="text-base font-bold text-red-800">
                                <span className="flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-red-600" />
                                    Delete User Permanently
                                </span>
                            </DialogTitle>
                            <DialogDescription className="text-xs mt-1 text-red-700">
                                This will permanently delete the user, their wallet, all withdrawals, and challenge progress. This cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="px-5 py-4">
                        {deleteDialog.user && (
                            <div className="bg-gray-50 rounded-xl divide-y divide-gray-100 overflow-hidden border border-gray-100">
                                <div className="flex items-center justify-between px-4 py-2.5">
                                    <span className="text-xs text-gray-500 font-medium">Name</span>
                                    <span className="text-sm font-medium text-gray-800">{deleteDialog.user.display_name ?? "No Name"}</span>
                                </div>
                                <div className="flex items-center justify-between px-4 py-2.5">
                                    <span className="text-xs text-gray-500 font-medium">Ad ID</span>
                                    <span className="text-sm font-mono text-gray-800 truncate max-w-48">{deleteDialog.user.current_ad_id}</span>
                                </div>
                                <div className="flex items-center justify-between px-4 py-2.5">
                                    <span className="text-xs text-gray-500 font-medium">Balance</span>
                                    <span className="text-sm font-mono text-gray-800">{deleteDialog.user.wallet_balance.toLocaleString()} coins</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="px-5 pb-5 pt-0 gap-2">
                        <Button variant="outline" onClick={() => setDeleteDialog({ open: false, user: null })} className="rounded-xl h-10" disabled={deleteLoading}>
                            Cancel
                        </Button>
                        <Button onClick={handleDelete} disabled={deleteLoading} className="rounded-xl h-10 font-semibold bg-red-500 hover:bg-red-600 text-white">
                            {deleteLoading
                                ? <><Loader2 className="w-4 h-4 animate-spin mr-1" /> Deleting…</>
                                : <><Trash2 className="w-4 h-4 mr-1" /> Delete Permanently</>
                            }
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
