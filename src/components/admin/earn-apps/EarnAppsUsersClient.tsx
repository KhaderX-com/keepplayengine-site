"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
    Activity,
    ArrowUpDown,
    ChevronLeft,
    ChevronRight,
    Coins,
    DollarSign,
    RefreshCw,
    Search,
    ShieldAlert,
    Users,
} from "lucide-react";
import type { EarnAppsUser } from "@/lib/earn-apps-dal";

const PAGE_SIZE = 20;

type UsersResponse = {
    users: EarnAppsUser[];
    total: number;
    stats: {
        totalUsers: number;
        activeLast24h: number;
        totalRevenueUsd: number;
        totalPointsBalance: number;
        lifetimePoints: number;
        withdrawnPoints: number;
        byStatus: Record<string, number>;
        byApp: Record<string, number>;
    };
};

function StatCard({ label, value, sub, icon }: { label: string; value: string; sub?: string; icon: React.ReactNode }) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-3 sm:p-4">
            <div className="mb-2 flex items-center justify-between gap-3">
                <span className="min-w-0 text-[11px] font-semibold uppercase tracking-wide text-gray-500 sm:text-xs">{label}</span>
                <span className="text-gray-500">{icon}</span>
            </div>
            <p className="break-words font-mono text-lg font-bold text-gray-900 sm:text-xl">{value}</p>
            {sub && <p className="mt-1 line-clamp-2 text-[11px] text-gray-500 sm:text-xs">{sub}</p>}
        </div>
    );
}

function usd(value: number) {
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`;
}

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
    if (status === "active") return "default";
    if (status === "banned" || status === "blocked") return "destructive";
    if (status === "suspended") return "secondary";
    return "outline";
}

export default function EarnAppsUsersClient() {
    const abortRef = useRef<AbortController | null>(null);
    const [data, setData] = useState<UsersResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [status, setStatus] = useState("all");
    const [sortBy, setSortBy] = useState("created_at");
    const [sortOrder, setSortOrder] = useState("desc");
    const [offset, setOffset] = useState(0);

    useEffect(() => {
        const timer = setTimeout(() => {
            setOffset(0);
            setDebouncedSearch(search);
        }, 350);
        return () => clearTimeout(timer);
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
            if (status !== "all") params.set("status", status);

            const res = await fetch(`/api/earn-apps/users?${params.toString()}`, {
                cache: "no-store",
                signal: controller.signal,
            });
            if (!res.ok) throw new Error(`Failed: ${res.status}`);
            setData(await res.json());
        } catch (err) {
            if (err instanceof DOMException && err.name === "AbortError") return;
            setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setLoading(false);
        }
    }, [offset, sortBy, sortOrder, debouncedSearch, status]);

    useEffect(() => { void fetchUsers(); }, [fetchUsers]);
    useEffect(() => () => abortRef.current?.abort(), []);

    const users = data?.users ?? [];
    const stats = data?.stats;
    const total = data?.total ?? 0;
    const totalPages = Math.ceil(total / PAGE_SIZE);
    const currentPage = Math.floor(offset / PAGE_SIZE) + 1;
    const apps = Object.entries(stats?.byApp ?? {}).sort((a, b) => b[1] - a[1]);

    const handleSort = (field: string) => {
        setOffset(0);
        if (sortBy === field) {
            setSortOrder((value) => value === "asc" ? "desc" : "asc");
        } else {
            setSortBy(field);
            setSortOrder("desc");
        }
    };

    return (
        <div className="mx-auto max-w-7xl space-y-4 sm:space-y-5">
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                <StatCard label="Users" value={(stats?.totalUsers ?? 0).toLocaleString()} sub={`${stats?.activeLast24h ?? 0} active in 24h`} icon={<Users className="h-4 w-4" />} />
                <StatCard label="Revenue" value={usd(stats?.totalRevenueUsd ?? 0)} sub="Supabase lifetime total" icon={<DollarSign className="h-4 w-4" />} />
                <StatCard label="Point Balance" value={(stats?.totalPointsBalance ?? 0).toLocaleString()} sub={`${(stats?.lifetimePoints ?? 0).toLocaleString()} lifetime`} icon={<Coins className="h-4 w-4" />} />
                <StatCard label="Withdrawn Points" value={(stats?.withdrawnPoints ?? 0).toLocaleString()} sub={apps[0] ? `Top app: ${apps[0][0]}` : "No app data"} icon={<Activity className="h-4 w-4" />} />
            </div>

            <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-3 sm:p-4 lg:flex-row">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search app ID, ad last4, install last4"
                        className="pl-9"
                    />
                </div>
                <select
                    value={status}
                    onChange={(event) => { setOffset(0); setStatus(event.target.value); }}
                    className="h-10 rounded-md border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700"
                    aria-label="Filter by status"
                >
                    <option value="all">All statuses</option>
                    {Object.keys(stats?.byStatus ?? {}).map((key) => (
                        <option key={key} value={key}>{key}</option>
                    ))}
                </select>
                <Button variant="outline" onClick={() => void fetchUsers()} disabled={loading}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    Refresh
                </Button>
            </div>

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                </div>
            )}

            <div className="space-y-3 lg:hidden">
                {loading ? (
                    Array.from({ length: 5 }).map((_, index) => (
                        <div key={index} className="rounded-xl border border-gray-200 bg-white p-4">
                            <div className="mb-3 flex items-center justify-between gap-3">
                                <Skeleton className="h-4 w-36" />
                                <Skeleton className="h-6 w-16 rounded-full" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <Skeleton className="h-14 rounded-lg" />
                                <Skeleton className="h-14 rounded-lg" />
                            </div>
                        </div>
                    ))
                ) : users.length ? (
                    users.map((user) => {
                        const flagCount = user.security_flags && typeof user.security_flags === "object"
                            ? Object.keys(user.security_flags).length
                            : 0;
                        return (
                            <div key={user.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                                <div className="mb-3 flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-gray-900" title={user.app_id}>{user.app_id}</p>
                                        <p className="mt-0.5 text-xs text-gray-500">{user.app_version ?? "unknown version"}</p>
                                    </div>
                                    <Badge variant={statusVariant(user.status)} className="shrink-0">{user.status}</Badge>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div className="rounded-lg bg-gray-50 px-3 py-2">
                                        <p className="text-[10px] font-semibold uppercase text-gray-400">Revenue</p>
                                        <p className="mt-1 font-mono text-sm font-bold text-gray-900">{usd(Number(user.total_revenue_usd ?? 0))}</p>
                                    </div>
                                    <div className="rounded-lg bg-gray-50 px-3 py-2">
                                        <p className="text-[10px] font-semibold uppercase text-gray-400">Balance</p>
                                        <p className="mt-1 font-mono text-sm font-bold text-gray-900">{Number(user.points_balance ?? 0).toLocaleString()}</p>
                                    </div>
                                    <div className="rounded-lg bg-gray-50 px-3 py-2">
                                        <p className="text-[10px] font-semibold uppercase text-gray-400">User</p>
                                        <p className="mt-1 truncate font-mono text-xs text-gray-900">ad:{user.ad_id_last4 ?? "none"}</p>
                                        <p className="truncate font-mono text-xs text-gray-500">install:{user.install_id_last4 ?? "none"}</p>
                                    </div>
                                    <div className="rounded-lg bg-gray-50 px-3 py-2">
                                        <p className="text-[10px] font-semibold uppercase text-gray-400">Platform</p>
                                        <div className="mt-1 flex items-center justify-between gap-2">
                                            <Badge variant="outline">{user.platform ?? "unknown"}</Badge>
                                            {flagCount ? (
                                                <Badge variant="secondary" className="gap-1">
                                                    <ShieldAlert className="h-3 w-3" />
                                                    {flagCount}
                                                </Badge>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-3 flex items-center justify-between gap-3 text-xs text-gray-500">
                                    <span>Lifetime {Number(user.lifetime_points ?? 0).toLocaleString()} pts</span>
                                    <span className="truncate text-right">
                                        {user.last_seen_at ? new Date(user.last_seen_at).toLocaleDateString() : "Never seen"}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="rounded-xl border border-gray-200 bg-white py-10 text-center text-sm text-gray-500">
                        No Earn Apps users found
                    </div>
                )}
            </div>

            <div className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white lg:block">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>
                                <button className="flex items-center gap-1" onClick={() => handleSort("app_id")}>
                                    App <ArrowUpDown className="h-3 w-3" />
                                </button>
                            </TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Platform</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">
                                <button className="ml-auto flex items-center gap-1" onClick={() => handleSort("total_revenue_usd")}>
                                    Revenue <ArrowUpDown className="h-3 w-3" />
                                </button>
                            </TableHead>
                            <TableHead className="text-right">
                                <button className="ml-auto flex items-center gap-1" onClick={() => handleSort("points_balance")}>
                                    Points <ArrowUpDown className="h-3 w-3" />
                                </button>
                            </TableHead>
                            <TableHead>
                                <button className="flex items-center gap-1" onClick={() => handleSort("last_seen_at")}>
                                    Last Seen <ArrowUpDown className="h-3 w-3" />
                                </button>
                            </TableHead>
                            <TableHead>Flags</TableHead>
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
                        ) : users.length ? (
                            users.map((user) => {
                                const flagCount = user.security_flags && typeof user.security_flags === "object"
                                    ? Object.keys(user.security_flags).length
                                    : 0;
                                return (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <p className="max-w-56 truncate text-sm font-semibold text-gray-900" title={user.app_id}>{user.app_id}</p>
                                            <p className="text-xs text-gray-500">{user.app_version ?? "unknown version"}</p>
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">
                                            <p>ad:{user.ad_id_last4 ?? "none"}</p>
                                            <p className="text-gray-500">install:{user.install_id_last4 ?? "none"}</p>
                                        </TableCell>
                                        <TableCell><Badge variant="outline">{user.platform ?? "unknown"}</Badge></TableCell>
                                        <TableCell><Badge variant={statusVariant(user.status)}>{user.status}</Badge></TableCell>
                                        <TableCell className="text-right font-mono">{usd(Number(user.total_revenue_usd ?? 0))}</TableCell>
                                        <TableCell className="text-right font-mono">
                                            <p>{Number(user.points_balance ?? 0).toLocaleString()}</p>
                                            <p className="text-xs text-gray-500">{Number(user.lifetime_points ?? 0).toLocaleString()} lifetime</p>
                                        </TableCell>
                                        <TableCell className="text-sm text-gray-500">
                                            {user.last_seen_at ? new Date(user.last_seen_at).toLocaleString() : "Never"}
                                        </TableCell>
                                        <TableCell>
                                            {flagCount ? (
                                                <Badge variant="secondary" className="gap-1">
                                                    <ShieldAlert className="h-3 w-3" />
                                                    {flagCount}
                                                </Badge>
                                            ) : (
                                                <span className="text-xs text-gray-400">none</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        ) : (
                            <TableRow>
                                <TableCell colSpan={8} className="py-10 text-center text-sm text-gray-500">
                                    No Earn Apps users found
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-3 sm:px-4">
                    <p className="text-xs text-gray-500 sm:text-sm">
                        {offset + 1}-{Math.min(offset + PAGE_SIZE, total)} of {total.toLocaleString()}
                    </p>
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
        </div>
    );
}
