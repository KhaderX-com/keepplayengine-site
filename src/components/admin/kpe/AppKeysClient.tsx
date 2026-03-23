"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { AlertDialog } from "@/components/ui/alert-dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Key,
    Plus,
    Search,
    RefreshCw,
    Copy,
    CheckCircle2,
    XCircle,
    Trash2,
    ShieldAlert,
    Eye,
    EyeOff,
    AlertTriangle,
    MoreVertical,
    PowerOff,
    Power,
} from "lucide-react";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface AppKey {
    id: string;
    app_name: string;
    app_type: string;
    is_active: boolean;
    created_at: string;
}

type AppType = "game" | "loyalty" | "service" | "admin";

const APP_TYPE_OPTIONS: { value: AppType; label: string }[] = [
    { value: "game", label: "Game" },
    { value: "loyalty", label: "Loyalty" },
    { value: "service", label: "Service" },
    { value: "admin", label: "Admin" },
];

const APP_TYPE_COLORS: Record<string, string> = {
    game: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    loyalty:
        "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
    service:
        "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    admin: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export default function AppKeysClient() {
    const [keys, setKeys] = useState<AppKey[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    // Create dialog state
    const [createOpen, setCreateOpen] = useState(false);
    const [newAppName, setNewAppName] = useState("");
    const [newAppType, setNewAppType] = useState<AppType>("game");
    const [creating, setCreating] = useState(false);

    // Reveal key dialog state (shown after successful creation)
    const [revealedKey, setRevealedKey] = useState<string | null>(null);
    const [revealedName, setRevealedName] = useState("");
    const [keyCopied, setKeyCopied] = useState(false);
    const [keyVisible, setKeyVisible] = useState(false);

    // Toggle / Delete confirmation (2-step)
    const [toggleTarget, setToggleTarget] = useState<AppKey | null>(null);
    const [toggleStep2, setToggleStep2] = useState<AppKey | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<AppKey | null>(null);
    const [deleteStep2, setDeleteStep2] = useState<AppKey | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // ── Fetch keys ───────────────────────────

    const fetchKeys = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/kpe/app-keys");
            if (!res.ok) {
                const body = await res.json().catch(() => null);
                throw new Error(
                    body?.error ?? `Failed to fetch (${res.status})`,
                );
            }
            const data = await res.json();
            setKeys(data.keys ?? []);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Unknown error",
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchKeys();
    }, [fetchKeys]);

    // ── Create key ───────────────────────────

    const handleCreate = async () => {
        if (!newAppName.trim()) return;
        setCreating(true);
        try {
            const res = await fetch("/api/kpe/app-keys", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    appName: newAppName.trim(),
                    appType: newAppType,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error ?? "Failed to create key");
            }
            // Close create dialog, open reveal dialog
            setCreateOpen(false);
            setNewAppName("");
            setNewAppType("game");
            setRevealedKey(data.rawKey);
            setRevealedName(data.key?.app_name ?? newAppName);
            setKeyCopied(false);
            setKeyVisible(false);
            // Refresh list
            fetchKeys();
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to create key",
            );
        } finally {
            setCreating(false);
        }
    };

    // ── Toggle active ────────────────────────

    const handleToggle = async (key: AppKey) => {
        setActionLoading(key.id);
        try {
            const res = await fetch("/api/kpe/app-keys", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    keyId: key.id,
                    isActive: !key.is_active,
                }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => null);
                throw new Error(data?.error ?? "Toggle failed");
            }
            fetchKeys();
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Toggle failed",
            );
        } finally {
            setActionLoading(null);
            setToggleTarget(null);
        }
    };

    // ── Delete key ───────────────────────────

    const handleDelete = async (key: AppKey) => {
        setActionLoading(key.id);
        try {
            const res = await fetch("/api/kpe/app-keys", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ keyId: key.id }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => null);
                throw new Error(data?.error ?? "Delete failed");
            }
            fetchKeys();
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Delete failed",
            );
        } finally {
            setActionLoading(null);
            setDeleteTarget(null);
        }
    };

    // ── Copy to clipboard ────────────────────

    const copyKey = async () => {
        if (!revealedKey) return;
        await navigator.clipboard.writeText(revealedKey);
        setKeyCopied(true);
        setTimeout(() => setKeyCopied(false), 2500);
    };

    // ── Filter keys ──────────────────────────

    const filteredKeys = keys.filter(
        (k) =>
            k.app_name.toLowerCase().includes(search.toLowerCase()) ||
            k.app_type.toLowerCase().includes(search.toLowerCase()),
    );

    // ── Render ───────────────────────────────

    return (
        <div className="space-y-6">
            {/* Error banner */}
            {error && (
                <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="text-sm font-medium text-red-800 dark:text-red-300">
                            {error}
                        </p>
                    </div>
                    <button
                        onClick={() => setError(null)}
                        className="text-red-600 dark:text-red-400 hover:opacity-80"
                        title="Dismiss error"
                    >
                        <XCircle className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="relative flex-1 w-full sm:max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        placeholder="Search by name or type..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchKeys}
                        disabled={loading}
                    >
                        <RefreshCw
                            className={`w-4 h-4 mr-1.5 ${loading ? "animate-spin" : ""}`}
                        />
                        Refresh
                    </Button>
                    <Button size="sm" onClick={() => setCreateOpen(true)}>
                        <Plus className="w-4 h-4 mr-1.5" />
                        Create Key
                    </Button>
                </div>
            </div>

            {/* Keys grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <Card key={i}>
                            <CardHeader className="pb-3">
                                <Skeleton className="h-5 w-32" />
                                <Skeleton className="h-4 w-20 mt-1" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-2/3 mt-2" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : filteredKeys.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Key className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                        <p className="text-gray-500 dark:text-gray-400">
                            {search
                                ? "No keys match your search"
                                : "No app keys found"}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredKeys.map((k) => (
                        <Card
                            key={k.id}
                            className={`transition-all ${
                                !k.is_active
                                    ? "opacity-60 border-dashed"
                                    : ""
                            }`}
                        >
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <Key className="w-4 h-4 text-gray-500 shrink-0" />
                                        <CardTitle className="text-base truncate">
                                            {k.app_name}
                                        </CardTitle>
                                    </div>
                                    <Badge
                                        className={
                                            APP_TYPE_COLORS[k.app_type] ??
                                            "bg-gray-100 text-gray-800"
                                        }
                                    >
                                        {k.app_type}
                                    </Badge>
                                </div>
                                <CardDescription className="text-xs mt-1">
                                    Created{" "}
                                    {new Date(k.created_at).toLocaleDateString(
                                        "en-GB",
                                        {
                                            day: "numeric",
                                            month: "short",
                                            year: "numeric",
                                        },
                                    )}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {/* Status */}
                                <div className="flex items-center gap-2">
                                    {k.is_active ? (
                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                    ) : (
                                        <XCircle className="w-4 h-4 text-red-500" />
                                    )}
                                    <span
                                        className={`text-sm font-medium ${
                                            k.is_active
                                                ? "text-green-700 dark:text-green-400"
                                                : "text-red-700 dark:text-red-400"
                                        }`}
                                    >
                                        {k.is_active ? "Active" : "Inactive"}
                                    </span>
                                </div>

                                {/* ID (truncated) */}
                                <p className="text-xs text-gray-400 font-mono truncate">
                                    ID: {k.id}
                                </p>

                                {/* Actions */}
                                <div className="flex items-center justify-end pt-1">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0"
                                                disabled={actionLoading === k.id}
                                            >
                                                <MoreVertical className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem
                                                onClick={() => setToggleTarget(k)}
                                            >
                                                {k.is_active ? (
                                                    <>
                                                        <PowerOff className="w-4 h-4 mr-2 text-amber-500" />
                                                        Deactivate
                                                    </>
                                                ) : (
                                                    <>
                                                        <Power className="w-4 h-4 mr-2 text-green-500" />
                                                        Activate
                                                    </>
                                                )}
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                                                onClick={() => setDeleteTarget(k)}
                                            >
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Summary */}
            {!loading && keys.length > 0 && (
                <p className="text-xs text-gray-400 text-center">
                    {filteredKeys.length} of {keys.length} key
                    {keys.length !== 1 ? "s" : ""} shown
                    {" · "}
                    {keys.filter((k) => k.is_active).length} active
                </p>
            )}

            {/* ── Create Key Dialog ────────────── */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ShieldAlert className="w-5 h-5 text-amber-500" />
                            Create New App Key
                        </DialogTitle>
                        <DialogDescription>
                            The raw API key will only be shown <strong>once</strong> after
                            creation. Make sure to copy it immediately.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="app-name">App Name</Label>
                            <Input
                                id="app-name"
                                placeholder="e.g. my_new_game"
                                value={newAppName}
                                onChange={(e) =>
                                    setNewAppName(
                                        e.target.value
                                            .toLowerCase()
                                            .replace(/[^a-z0-9_]/g, ""),
                                    )
                                }
                                maxLength={100}
                            />
                            <p className="text-xs text-gray-500">
                                Lowercase letters, numbers, and underscores only
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="app-type">App Type</Label>
                            <Select
                                value={newAppType}
                                onValueChange={(v) =>
                                    setNewAppType(v as AppType)
                                }
                            >
                                <SelectTrigger id="app-type">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {APP_TYPE_OPTIONS.map((opt) => (
                                        <SelectItem
                                            key={opt.value}
                                            value={opt.value}
                                        >
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setCreateOpen(false)}
                            disabled={creating}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreate}
                            disabled={
                                creating || newAppName.trim().length < 2
                            }
                        >
                            {creating ? (
                                <>
                                    <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Key className="w-4 h-4 mr-1.5" />
                                    Generate Key
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Revealed Key Dialog ──────────── */}
            <Dialog
                open={!!revealedKey}
                onOpenChange={(open) => {
                    if (!open) {
                        setRevealedKey(null);
                        setKeyVisible(false);
                    }
                }}
            >
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                            <CheckCircle2 className="w-5 h-5" />
                            Key Created Successfully
                        </DialogTitle>
                        <DialogDescription>
                            Copy the API key for <strong>{revealedName}</strong>{" "}
                            now. It will <strong>never be shown again</strong>.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3 py-2">
                        {/* Warning banner */}
                        <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3">
                            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-800 dark:text-amber-300">
                                This is the only time this key will be displayed.
                                Store it securely. If lost, you must delete this
                                key and create a new one.
                            </p>
                        </div>

                        {/* Key display */}
                        <div className="relative">
                            <div className="flex items-center gap-2 rounded-lg bg-gray-900 dark:bg-gray-950 p-4 font-mono text-sm text-green-400 break-all select-all">
                                {keyVisible
                                    ? revealedKey
                                    : "•".repeat(48)}
                                <div className="flex items-center gap-1 shrink-0 ml-2">
                                    <button
                                        onClick={() =>
                                            setKeyVisible(!keyVisible)
                                        }
                                        className="p-1 rounded hover:bg-gray-700 transition-colors"
                                        title={
                                            keyVisible
                                                ? "Hide key"
                                                : "Show key"
                                        }
                                    >
                                        {keyVisible ? (
                                            <EyeOff className="w-4 h-4 text-gray-400" />
                                        ) : (
                                            <Eye className="w-4 h-4 text-gray-400" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            onClick={copyKey}
                            className={
                                keyCopied
                                    ? "bg-green-600 hover:bg-green-700"
                                    : ""
                            }
                        >
                            {keyCopied ? (
                                <>
                                    <CheckCircle2 className="w-4 h-4 mr-1.5" />
                                    Copied!
                                </>
                            ) : (
                                <>
                                    <Copy className="w-4 h-4 mr-1.5" />
                                    Copy Key
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Toggle Confirmation — Step 1 ──────────── */}
            <AlertDialog
                open={!!toggleTarget}
                onOpenChange={(open) => {
                    if (!open) setToggleTarget(null);
                }}
                title={
                    toggleTarget?.is_active
                        ? "Deactivate App Key?"
                        : "Activate App Key?"
                }
                description={
                    toggleTarget?.is_active
                        ? `You are about to deactivate "${toggleTarget.app_name}". This will revoke API access immediately. Do you wish to continue?`
                        : `You are about to re-enable "${toggleTarget?.app_name}". This will restore API access for all apps using this key. Do you wish to continue?`
                }
                confirmText={
                    toggleTarget?.is_active ? "Yes, Deactivate" : "Yes, Activate"
                }
                variant={toggleTarget?.is_active ? "warning" : "info"}
                onConfirm={() => {
                    if (toggleTarget) {
                        setToggleStep2(toggleTarget);
                        setToggleTarget(null);
                    }
                }}
            />

            {/* ── Toggle Confirmation — Step 2 ──────────── */}
            <AlertDialog
                open={!!toggleStep2}
                onOpenChange={(open) => {
                    if (!open) setToggleStep2(null);
                }}
                title={
                    toggleStep2?.is_active
                        ? "Final Confirmation — Deactivate?"
                        : "Final Confirmation — Activate?"
                }
                description={
                    toggleStep2?.is_active
                        ? `This is your second and final warning. Deactivating "${toggleStep2.app_name}" will immediately reject all live API requests using this key. Confirm to proceed.`
                        : `This is your second and final confirmation. Activating "${toggleStep2?.app_name}" will instantly restore API access. Confirm to proceed.`
                }
                confirmText={
                    toggleStep2?.is_active ? "Confirm Deactivation" : "Confirm Activation"
                }
                variant={toggleStep2?.is_active ? "warning" : "info"}
                onConfirm={() => {
                    if (toggleStep2) handleToggle(toggleStep2);
                }}
            />

            {/* ── Delete Confirmation — Step 1 ──────────── */}
            <AlertDialog
                open={!!deleteTarget}
                onOpenChange={(open) => {
                    if (!open) setDeleteTarget(null);
                }}
                title="Permanently Delete App Key?"
                description={`You are about to permanently delete the key for "${deleteTarget?.app_name}". This action cannot be undone. Any application using this key will lose access immediately. Are you sure?`}
                confirmText="Yes, Delete It"
                variant="danger"
                onConfirm={() => {
                    if (deleteTarget) {
                        setDeleteStep2(deleteTarget);
                        setDeleteTarget(null);
                    }
                }}
            />

            {/* ── Delete Confirmation — Step 2 ──────────── */}
            <AlertDialog
                open={!!deleteStep2}
                onOpenChange={(open) => {
                    if (!open) setDeleteStep2(null);
                }}
                title="This Cannot Be Undone — Final Warning!"
                description={`Last chance. "${deleteStep2?.app_name}" and its key will be erased from the system forever. There is no recovery. Click "Delete Forever" only if you are completely certain.`}
                confirmText="Delete Forever"
                variant="danger"
                onConfirm={() => {
                    if (deleteStep2) handleDelete(deleteStep2);
                }}
            />
        </div>
    );
}
