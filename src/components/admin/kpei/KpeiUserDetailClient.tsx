"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
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
import {
    ArrowLeft,
    User,
    Wallet,
    MapPin,
    CalendarDays,
    RefreshCw,
    Edit3,
    Trash2,
    Loader2,
    AlertTriangle,
    CheckCircle2,
    Clock,
    DollarSign,
    Gamepad2,
    Save,
    X,
} from "lucide-react";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface UserProfile {
    id: string;
    display_name: string | null;
    current_ad_id: string;
    previous_ad_id: string | null;
    fcm_token: string | null;
    country_code: string | null;
    city: string | null;
    latitude: number | null;
    longitude: number | null;
    created_at: string;
    updated_at: string;
}

interface UserWallet {
    balance: number;
    updated_at: string;
}

interface UserWithdrawal {
    id: string;
    method: string;
    amount_coins: number;
    amount_usd: string;
    payout_address: string;
    status: string;
    denial_reason: string | null;
    created_at: string;
    processed_at: string | null;
}

interface UserChallenge {
    game_id: string;
    day: string;
    coins_earned: number;
    bonus_coins: number;
    claimed: boolean;
    claimed_at: string | null;
}

interface UserDetail {
    success: boolean;
    profile: UserProfile;
    wallet: UserWallet;
    withdrawals: UserWithdrawal[];
    challenges: UserChallenge[];
}

const COIN_TO_USD = 0.00001;
const toUsd = (coins: number) => {
    const usd = coins * COIN_TO_USD;
    if (usd < 0.01 && usd > 0) return `$${usd.toFixed(5)}`;
    return `$${usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
    pending:    { label: "Pending",    bg: "bg-blue-50",    text: "text-blue-700",    dot: "bg-blue-400"    },
    processing: { label: "Processing", bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-400"   },
    approved:   { label: "Approved",   bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400" },
    paid:       { label: "Paid",       bg: "bg-green-50",   text: "text-green-700",   dot: "bg-green-400"   },
    denied:     { label: "Denied",     bg: "bg-red-50",     text: "text-red-700",     dot: "bg-red-400"     },
};

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

interface Props {
    userId: string;
}

export default function KpeiUserDetailClient({ userId }: Props) {
    const router = useRouter();

    const [data, setData] = useState<UserDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Edit mode
    const [editing, setEditing] = useState(false);
    const [editName, setEditName] = useState("");
    const [editCountry, setEditCountry] = useState("");
    const [editCity, setEditCity] = useState("");
    const [editLoading, setEditLoading] = useState(false);

    // Balance edit
    const [editBalance, setEditBalance] = useState(false);
    const [newBalance, setNewBalance] = useState("");
    const [balanceLoading, setBalanceLoading] = useState(false);

    // Delete
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const fetchDetail = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/kpei/users/${userId}`);
            if (!res.ok) throw new Error(`Failed: ${res.status}`);
            const json: UserDetail = await res.json();
            if (!json.success) throw new Error("User not found");
            setData(json);
            setEditName(json.profile.display_name ?? "");
            setEditCountry(json.profile.country_code ?? "");
            setEditCity(json.profile.city ?? "");
            setNewBalance(String(json.wallet.balance));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => { fetchDetail(); }, [fetchDetail]);

    const handleSaveProfile = async () => {
        setEditLoading(true);
        try {
            const res = await fetch(`/api/kpei/users/${userId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "update_profile",
                    display_name: editName || undefined,
                    country_code: editCountry || undefined,
                    city: editCity || undefined,
                }),
            });
            if (!res.ok) throw new Error("Update failed");
            setEditing(false);
            fetchDetail();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to update");
        } finally {
            setEditLoading(false);
        }
    };

    const handleSaveBalance = async () => {
        const val = parseInt(newBalance, 10);
        if (isNaN(val) || val < 0) { alert("Invalid balance value"); return; }
        setBalanceLoading(true);
        try {
            const res = await fetch(`/api/kpei/users/${userId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "update_balance", new_balance: val }),
            });
            if (!res.ok) throw new Error("Failed to update balance");
            setEditBalance(false);
            fetchDetail();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed");
        } finally {
            setBalanceLoading(false);
        }
    };

    const handleDelete = async () => {
        setDeleteLoading(true);
        try {
            const res = await fetch("/api/kpei/users", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: userId }),
            });
            const json = await res.json();
            if (!res.ok || !json.success) throw new Error(json.error || "Delete failed");
            router.push("/admin/kpe/users");
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed");
        } finally {
            setDeleteLoading(false);
        }
    };

    // ── Loading ──
    if (loading) {
        return (
            <div className="max-w-4xl mx-auto space-y-5">
                <Skeleton className="h-8 w-32 rounded-xl" />
                <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                    <Skeleton className="h-5 w-48" />
                    <div className="grid grid-cols-2 gap-4">
                        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-xl" />)}
                    </div>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="max-w-4xl mx-auto">
                <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-700">
                    <p className="font-medium">{error ?? "User not found"}</p>
                    <div className="mt-3 flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => router.push("/admin/kpe/users")}>
                            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Users
                        </Button>
                        <Button variant="outline" size="sm" onClick={fetchDetail}>Retry</Button>
                    </div>
                </div>
            </div>
        );
    }

    const { profile, wallet, withdrawals, challenges } = data;
    const totalWithdrawnCoins = withdrawals.reduce((s, w) => s + (w.status === "paid" ? w.amount_coins : 0), 0);

    return (
        <div className="max-w-4xl mx-auto space-y-5">
            {/* Back + Actions */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => router.push("/admin/kpe/users")}
                    className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Users
                </button>
                <div className="flex items-center gap-2">
                    <button onClick={fetchDetail} className="p-2 rounded-xl hover:bg-gray-100 transition-colors" title="Refresh">
                        <RefreshCw className="w-4 h-4 text-gray-500" />
                    </button>
                    <button onClick={() => setDeleteOpen(true)} className="p-2 rounded-xl hover:bg-red-50 transition-colors text-gray-400 hover:text-red-500" title="Delete user">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* ── Profile Card ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 bg-linear-to-r from-blue-50 to-indigo-50 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-linear-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-lg">
                            {(profile.display_name ?? profile.current_ad_id).slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-900 text-lg leading-tight">
                                {profile.display_name ?? "No Name"}
                            </h2>
                            <p className="text-xs text-gray-500 font-mono">{profile.current_ad_id}</p>
                        </div>
                    </div>
                    {!editing && (
                        <button onClick={() => setEditing(true)} title="Edit profile" className="p-2 rounded-xl hover:bg-white/60 transition-colors text-gray-500">
                            <Edit3 className="w-4 h-4" />
                        </button>
                    )}
                </div>

                <div className="p-5">
                    {editing ? (
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-medium text-gray-600 mb-1 block">Display Name</label>
                                <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="rounded-xl" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-medium text-gray-600 mb-1 block">Country Code</label>
                                    <Input value={editCountry} onChange={(e) => setEditCountry(e.target.value)} placeholder="US" className="rounded-xl" />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-600 mb-1 block">City</label>
                                    <Input value={editCity} onChange={(e) => setEditCity(e.target.value)} className="rounded-xl" />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" size="sm" onClick={() => setEditing(false)} className="rounded-xl">
                                    <X className="w-3.5 h-3.5 mr-1" /> Cancel
                                </Button>
                                <Button size="sm" onClick={handleSaveProfile} disabled={editLoading} className="rounded-xl bg-blue-500 hover:bg-blue-600 text-white">
                                    {editLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Save className="w-3.5 h-3.5 mr-1" />}
                                    Save
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            <InfoField icon={<User className="w-3.5 h-3.5" />} label="Ad ID" value={profile.current_ad_id} mono />
                            {profile.previous_ad_id && (
                                <InfoField icon={<User className="w-3.5 h-3.5" />} label="Previous Ad ID" value={profile.previous_ad_id} mono />
                            )}
                            <InfoField icon={<MapPin className="w-3.5 h-3.5" />} label="Location" value={
                                profile.country_code ? `${profile.country_code}${profile.city ? ` · ${profile.city}` : ""}` : "—"
                            } />
                            <InfoField icon={<CalendarDays className="w-3.5 h-3.5" />} label="Joined" value={
                                new Date(profile.created_at).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })
                            } />
                            <InfoField icon={<CalendarDays className="w-3.5 h-3.5" />} label="Last Updated" value={
                                new Date(profile.updated_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
                            } />
                            {profile.latitude && profile.longitude && (
                                <InfoField icon={<MapPin className="w-3.5 h-3.5" />} label="Coordinates" value={`${profile.latitude.toFixed(4)}, ${profile.longitude.toFixed(4)}`} mono />
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Wallet Card ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-amber-500" /> Wallet
                    </h3>
                    {!editBalance && (
                        <button onClick={() => setEditBalance(true)} className="text-xs text-blue-500 hover:text-blue-700 font-medium">
                            Edit Balance
                        </button>
                    )}
                </div>
                <div className="p-5">
                    {editBalance ? (
                        <div className="flex items-end gap-3">
                            <div className="flex-1">
                                <label className="text-xs font-medium text-gray-600 mb-1 block">New Balance (coins)</label>
                                <Input
                                    type="number"
                                    value={newBalance}
                                    onChange={(e) => setNewBalance(e.target.value)}
                                    min={0}
                                    className="rounded-xl font-mono"
                                />
                            </div>
                            <Button variant="outline" size="sm" onClick={() => setEditBalance(false)} className="rounded-xl h-9">Cancel</Button>
                            <Button size="sm" onClick={handleSaveBalance} disabled={balanceLoading} className="rounded-xl h-9 bg-amber-500 hover:bg-amber-600 text-white">
                                {balanceLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save"}
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            <div>
                                <p className="text-xs text-gray-400 font-medium mb-0.5">Current Balance</p>
                                <p className="text-2xl font-bold text-gray-900 font-mono">{wallet.balance.toLocaleString()}</p>
                                <p className="text-xs text-gray-400 font-mono">{toUsd(wallet.balance)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-medium mb-0.5">Total Withdrawn</p>
                                <p className="text-lg font-semibold text-gray-700 font-mono">{totalWithdrawnCoins.toLocaleString()}</p>
                                <p className="text-xs text-gray-400 font-mono">{toUsd(totalWithdrawnCoins)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-medium mb-0.5">Lifetime Earned</p>
                                <p className="text-lg font-semibold text-gray-700 font-mono">
                                    {(wallet.balance + totalWithdrawnCoins).toLocaleString()}
                                </p>
                                <p className="text-xs text-gray-400 font-mono">{toUsd(wallet.balance + totalWithdrawnCoins)}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Withdrawals ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-500" /> Withdrawals ({withdrawals.length})
                    </h3>
                </div>
                {withdrawals.length > 0 ? (
                    <div className="divide-y divide-gray-50">
                        {withdrawals.map((w) => {
                            const cfg = STATUS_CONFIG[w.status] ?? STATUS_CONFIG.processing;
                            return (
                                <div key={w.id} className="px-5 py-3 flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="text-sm font-medium capitalize">{w.method}</span>
                                            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                                {cfg.label}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-400 font-mono truncate">{w.payout_address}</p>
                                        <p className="text-[11px] text-gray-400">
                                            {new Date(w.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                                        </p>
                                        {w.denial_reason && (
                                            <p className="text-[11px] text-red-500 mt-0.5">Reason: {w.denial_reason}</p>
                                        )}
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-sm font-bold text-gray-900">${parseFloat(w.amount_usd).toFixed(2)}</p>
                                        <p className="text-[11px] text-gray-400 font-mono">{w.amount_coins.toLocaleString()} coins</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="py-8 text-center text-gray-400">
                        <DollarSign className="w-6 h-6 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No withdrawals yet</p>
                    </div>
                )}
            </div>

            {/* ── Daily Challenges ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                        <Gamepad2 className="w-4 h-4 text-purple-500" /> Daily Challenges ({challenges.length})
                    </h3>
                </div>
                {challenges.length > 0 ? (
                    <div className="divide-y divide-gray-50">
                        {challenges.map((c, i) => (
                            <div key={i} className="px-5 py-3 flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-sm font-medium text-gray-800">{c.game_id}</span>
                                        {c.claimed ? (
                                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-700">
                                                <CheckCircle2 className="w-3 h-3" /> Claimed
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                                                <Clock className="w-3 h-3" /> Unclaimed
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-400">
                                        {new Date(c.day + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                                    </p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-sm font-bold text-gray-900">{c.coins_earned.toLocaleString()}</p>
                                    {c.bonus_coins > 0 && (
                                        <p className="text-[11px] text-amber-500 font-semibold">+{c.bonus_coins.toLocaleString()} bonus</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-8 text-center text-gray-400">
                        <Gamepad2 className="w-6 h-6 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No challenge progress yet</p>
                    </div>
                )}
            </div>

            {/* ── Delete Dialog ── */}
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
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
                                This will permanently delete {profile.display_name ?? "this user"} and all associated data.
                            </DialogDescription>
                        </DialogHeader>
                    </div>
                    <DialogFooter className="px-5 py-4 gap-2">
                        <Button variant="outline" onClick={() => setDeleteOpen(false)} className="rounded-xl h-10" disabled={deleteLoading}>
                            Cancel
                        </Button>
                        <Button onClick={handleDelete} disabled={deleteLoading} className="rounded-xl h-10 font-semibold bg-red-500 hover:bg-red-600 text-white">
                            {deleteLoading
                                ? <><Loader2 className="w-4 h-4 animate-spin mr-1" /> Deleting…</>
                                : <><Trash2 className="w-4 h-4 mr-1" /> Delete</>
                            }
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// ─────────────────────────────────────────────
// Info Field helper
// ─────────────────────────────────────────────

function InfoField({ icon, label, value, mono }: { icon: React.ReactNode; label: string; value: string; mono?: boolean }) {
    return (
        <div>
            <p className="text-xs text-gray-400 font-medium flex items-center gap-1 mb-0.5">
                {icon} {label}
            </p>
            <p className={`text-sm text-gray-800 ${mono ? "font-mono" : ""} break-all`}>{value}</p>
        </div>
    );
}
