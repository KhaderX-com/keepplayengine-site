"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { KpeUserListItem, KpeUserListResponse } from "@/lib/supabase-kpe";
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
import {
    Search,
    ChevronLeft,
    ChevronRight,
    Users,
    UserCheck,
    UserX,
    ArrowUpDown,
} from "lucide-react";

const PAGE_SIZE = 20;

const STATUS_BADGE: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
    active: { variant: "default", label: "Active" },
    suspended: { variant: "secondary", label: "Suspended" },
    banned: { variant: "destructive", label: "Banned" },
};

export default function KpeUsersClient() {
    const router = useRouter();
    const [data, setData] = useState<KpeUserListResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [sortBy, setSortBy] = useState("created_at");
    const [sortOrder, setSortOrder] = useState("desc");
    const [offset, setOffset] = useState(0);

    // Debounce search input
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);
        return () => clearTimeout(handler);
    }, [search]);

    const fetchUsers = useCallback(async () => {
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
            if (statusFilter !== "all") params.set("status", statusFilter);

            const res = await fetch(`/api/kpe/users?${params.toString()}`);
            if (!res.ok) {
                if (res.status === 429) {
                    throw new Error("Too many requests. Please wait a moment.");
                }
                throw new Error(`Failed to fetch users: ${res.status}`);
            }
            const json: KpeUserListResponse = await res.json();
            setData(json);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setLoading(false);
        }
    }, [offset, sortBy, sortOrder, debouncedSearch, statusFilter]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // Reset offset when filters change
    useEffect(() => {
        setOffset(0);
    }, [debouncedSearch, statusFilter]);

    const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;
    const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

    const handleSort = (field: string) => {
        if (sortBy === field) {
            setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
        } else {
            setSortBy(field);
            setSortOrder("desc");
        }
    };

    // Stats from data
    const stats = {
        total: data?.total ?? 0,
        showing: data?.users?.length ?? 0,
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-500 font-medium">Total Users</span>
                        <Users className="w-5 h-5 text-blue-500" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{stats.total.toLocaleString()}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-500 font-medium">Showing</span>
                        <UserCheck className="w-5 h-5 text-green-500" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{stats.showing}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200 hidden sm:block">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-500 font-medium">Page</span>
                        <UserX className="w-5 h-5 text-gray-400" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{currentPage} / {totalPages || 1}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl p-4 border border-gray-200">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by ad ID..."
                            className="pl-9"
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="suspended">Suspended</SelectItem>
                            <SelectItem value="banned">Banned</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
                    <p className="font-medium">Error loading users</p>
                    <p className="text-sm mt-1">{error}</p>
                    <Button variant="outline" size="sm" className="mt-2" onClick={fetchUsers}>
                        Retry
                    </Button>
                </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[200px]">
                                <button onClick={() => handleSort("ad_id")} className="flex items-center gap-1 hover:text-gray-900">
                                    Ad ID <ArrowUpDown className="w-3 h-3" />
                                </button>
                            </TableHead>
                            <TableHead>Platform</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Display Name</TableHead>
                            <TableHead className="text-right">
                                <button onClick={() => handleSort("wallet_balance")} className="flex items-center gap-1 ml-auto hover:text-gray-900">
                                    Balance <ArrowUpDown className="w-3 h-3" />
                                </button>
                            </TableHead>
                            <TableHead className="text-right">Withdrawals</TableHead>
                            <TableHead className="text-right">Ad Events</TableHead>
                            <TableHead>
                                <button onClick={() => handleSort("created_at")} className="flex items-center gap-1 hover:text-gray-900">
                                    Joined <ArrowUpDown className="w-3 h-3" />
                                </button>
                            </TableHead>
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
                        ) : data?.users?.length ? (
                            data.users.map((user: KpeUserListItem) => (
                                <TableRow
                                    key={user.id}
                                    className="cursor-pointer hover:bg-gray-50"
                                    onClick={() => router.push(`/admin/keepplay-engine/users/${user.id}`)}
                                >
                                    <TableCell className="font-mono text-sm">
                                        {user.ad_id.length > 20
                                            ? `${user.ad_id.slice(0, 20)}...`
                                            : user.ad_id}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{user.platform}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={STATUS_BADGE[user.status]?.variant ?? "outline"}>
                                            {STATUS_BADGE[user.status]?.label ?? user.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{user.display_name || "—"}</TableCell>
                                    <TableCell className="text-right font-mono">
                                        <span className="inline-flex items-center gap-1">
                                            <img src="https://res.cloudinary.com/destej60y/image/upload/v1773604391/coin_j3p6w0.png" alt="coins" className="w-4 h-4" />
                                            {user.wallet_balance.toLocaleString()}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">{user.total_withdrawals}</TableCell>
                                    <TableCell className="text-right">{user.total_ad_events.toLocaleString()}</TableCell>
                                    <TableCell className="text-sm text-gray-500">
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                                    No users found
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                        <p className="text-sm text-gray-500">
                            Showing {offset + 1}–{Math.min(offset + PAGE_SIZE, data?.total ?? 0)} of {data?.total ?? 0}
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
                                disabled={offset + PAGE_SIZE >= (data?.total ?? 0)}
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
}
