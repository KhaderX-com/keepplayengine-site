"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { KpeUserDetail } from "@/lib/supabase-kpe";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    ArrowLeft,
    User,
    Wallet,
    ArrowDownUp,
    GamepadIcon,
    ArrowUpRight,
    ArrowDownLeft,
} from "lucide-react";

interface Props {
    userId: string;
}

const STATUS_BADGE: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
    active: { variant: "default", label: "Active" },
    suspended: { variant: "secondary", label: "Suspended" },
    banned: { variant: "destructive", label: "Banned" },
    pending: { variant: "outline", label: "Pending" },
    approved: { variant: "default", label: "Approved" },
    rejected: { variant: "destructive", label: "Rejected" },
    completed: { variant: "default", label: "Completed" },
};

export default function KpeUserDetailClient({ userId }: Props) {
    const router = useRouter();
    const [data, setData] = useState<KpeUserDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchUser() {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`/api/kpe/users/${userId}`);
                if (!res.ok) {
                    throw new Error(`Failed to fetch user: ${res.status}`);
                }
                const json: KpeUserDetail = await res.json();
                setData(json);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Unknown error");
            } finally {
                setLoading(false);
            }
        }
        fetchUser();
    }, [userId]);

    if (loading) {
        return (
            <div className="max-w-5xl mx-auto space-y-6">
                <Skeleton className="h-8 w-48" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Skeleton className="h-48" />
                    <Skeleton className="h-48" />
                </div>
                <Skeleton className="h-64" />
            </div>
        );
    }

    if (error || !data?.success) {
        return (
            <div className="max-w-5xl mx-auto">
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
                    <p className="font-medium">Error loading user</p>
                    <p className="text-sm mt-1">{error || "User not found"}</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => router.back()}>
                        <ArrowLeft className="w-4 h-4 mr-1" /> Go Back
                    </Button>
                </div>
            </div>
        );
    }

    const { user, wallet, profile, recent_transactions, recent_withdrawals, game_earnings } = data;

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Back Button */}
            <Button variant="ghost" size="sm" onClick={() => router.push("/admin/keepplay-engine/users")}>
                <ArrowLeft className="w-4 h-4 mr-1" /> Back to Users
            </Button>

            {/* User Info + Wallet Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* User Info */}
                <Card>
                    <CardHeader className="flex flex-row items-center gap-3 pb-3">
                        <div className="bg-blue-100 rounded-lg p-2">
                            <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <CardTitle className="text-lg">User Info</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <InfoRow label="ID" value={user.id} mono />
                        <InfoRow label="Ad ID" value={user.ad_id} mono />
                        <InfoRow label="Platform" value={user.platform} />
                        <InfoRow label="Display Name" value={profile?.display_name || "—"} />
                        <InfoRow label="Status">
                            <Badge variant={STATUS_BADGE[user.status]?.variant ?? "outline"}>
                                {STATUS_BADGE[user.status]?.label ?? user.status}
                            </Badge>
                        </InfoRow>
                        <InfoRow label="FCM Token" value={user.fcm_token ? "Present" : "None"} />
                        <InfoRow label="Joined" value={new Date(user.created_at).toLocaleString()} />
                        <InfoRow label="Updated" value={new Date(user.updated_at).toLocaleString()} />
                    </CardContent>
                </Card>

                {/* Wallet */}
                <Card>
                    <CardHeader className="flex flex-row items-center gap-3 pb-3">
                        <div className="bg-amber-100 rounded-lg p-2">
                            <Wallet className="w-5 h-5 text-amber-600" />
                        </div>
                        <CardTitle className="text-lg">Wallet</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {wallet ? (
                            <div className="space-y-3">
                                <InfoRow label="Wallet ID" value={wallet.id} mono />
                                <InfoRow label="Balance">
                                    <span className="inline-flex items-center gap-1.5 text-xl font-bold text-gray-900">
                                        <img src="https://res.cloudinary.com/destej60y/image/upload/v1773604391/coin_j3p6w0.png" alt="coins" className="w-5 h-5" />
                                        {wallet.balance.toLocaleString()}
                                    </span>
                                </InfoRow>
                                <InfoRow label="Currency" value={wallet.currency} />
                                <InfoRow label="Created" value={new Date(wallet.created_at).toLocaleString()} />
                            </div>
                        ) : (
                            <p className="text-gray-400 text-sm">No wallet found</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Tabs for Transactions, Withdrawals, Game Earnings */}
            <Tabs defaultValue="transactions">
                <TabsList>
                    <TabsTrigger value="transactions" className="gap-1">
                        <ArrowDownUp className="w-4 h-4" /> Transactions ({recent_transactions.length})
                    </TabsTrigger>
                    <TabsTrigger value="withdrawals" className="gap-1">
                        <ArrowUpRight className="w-4 h-4" /> Withdrawals ({recent_withdrawals.length})
                    </TabsTrigger>
                    <TabsTrigger value="games" className="gap-1">
                        <GamepadIcon className="w-4 h-4" /> Game Earnings ({game_earnings.length})
                    </TabsTrigger>
                </TabsList>

                {/* Transactions */}
                <TabsContent value="transactions">
                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Source</TableHead>
                                        <TableHead>Game</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                        <TableHead className="text-right">Balance After</TableHead>
                                        <TableHead>Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recent_transactions.length > 0 ? (
                                        recent_transactions.map((tx) => (
                                            <TableRow key={tx.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-1">
                                                        {tx.type === "credit" ? (
                                                            <ArrowDownLeft className="w-3 h-3 text-green-500" />
                                                        ) : (
                                                            <ArrowUpRight className="w-3 h-3 text-red-500" />
                                                        )}
                                                        <Badge variant={tx.type === "credit" ? "default" : "secondary"}>
                                                            {tx.type}
                                                        </Badge>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm">{tx.source}</TableCell>
                                                <TableCell className="text-sm">{tx.game_name || "—"}</TableCell>
                                                <TableCell className={`text-right font-mono ${tx.type === "credit" ? "text-green-600" : "text-red-600"}`}>
                                                    <span className="inline-flex items-center gap-1 justify-end">
                                                        {tx.type === "credit" ? "+" : "-"}{tx.amount.toLocaleString()}
                                                        <img src="https://res.cloudinary.com/destej60y/image/upload/v1773604391/coin_j3p6w0.png" alt="coins" className="w-3.5 h-3.5" />
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right font-mono">
                                                    <span className="inline-flex items-center gap-1 justify-end">
                                                        {tx.balance_after.toLocaleString()}
                                                        <img src="https://res.cloudinary.com/destej60y/image/upload/v1773604391/coin_j3p6w0.png" alt="coins" className="w-3.5 h-3.5" />
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-sm text-gray-500">
                                                    {new Date(tx.created_at).toLocaleString()}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-6 text-gray-400">
                                                No recent transactions
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Withdrawals */}
                <TabsContent value="withdrawals">
                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Method</TableHead>
                                        <TableHead>Destination</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Points</TableHead>
                                        <TableHead>Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recent_withdrawals.length > 0 ? (
                                        recent_withdrawals.map((w) => (
                                            <TableRow key={w.id}>
                                                <TableCell className="text-sm">{w.method_key}</TableCell>
                                                <TableCell className="font-mono text-sm">{w.destination_masked}</TableCell>
                                                <TableCell>
                                                    <Badge variant={STATUS_BADGE[w.status]?.variant ?? "outline"}>
                                                        {STATUS_BADGE[w.status]?.label ?? w.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right font-mono">{w.amount_points.toLocaleString()}</TableCell>
                                                <TableCell className="text-sm text-gray-500">
                                                    {new Date(w.created_at).toLocaleString()}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-6 text-gray-400">
                                                No withdrawal requests
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Game Earnings */}
                <TabsContent value="games">
                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Game</TableHead>
                                        <TableHead className="text-right">Total Coins</TableHead>
                                        <TableHead className="text-right">Total Events</TableHead>
                                        <TableHead>Last Earned</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {game_earnings.length > 0 ? (
                                        game_earnings.map((g, i) => (
                                            <TableRow key={`${g.game_name}-${i}`}>
                                                <TableCell className="font-medium">{g.game_name}</TableCell>
                                                <TableCell className="text-right font-mono">{g.total_coins_earned.toLocaleString()}</TableCell>
                                                <TableCell className="text-right">{g.total_events.toLocaleString()}</TableCell>
                                                <TableCell className="text-sm text-gray-500">
                                                    {new Date(g.last_earned_at).toLocaleString()}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-6 text-gray-400">
                                                No game earnings recorded
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function InfoRow({ label, value, mono, children }: {
    label: string;
    value?: string;
    mono?: boolean;
    children?: React.ReactNode;
}) {
    return (
        <div className="flex items-center justify-between py-1 border-b border-gray-100 last:border-0">
            <span className="text-sm text-gray-500">{label}</span>
            {children ?? (
                <span className={`text-sm font-medium text-gray-900 ${mono ? "font-mono text-xs" : ""}`}>
                    {value}
                </span>
            )}
        </div>
    );
}
