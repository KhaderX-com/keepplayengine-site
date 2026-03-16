"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { Pencil, Save, X, RefreshCw, ImageOff, Eye, Gamepad2, ExternalLink, Smartphone, Trophy, Target, Wallet } from "lucide-react";

// ─────────────────────────────────────────────
// Column & Table config
// ─────────────────────────────────────────────

type ColType = "text" | "number" | "boolean" | "json";

interface ColDef {
    key: string;
    label: string;
    editable: boolean;
    type?: ColType;
    wide?: boolean;
}

interface TableDef {
    label: string;
    table: string;
    description: string;
    columns: ColDef[];
}

const TABLES: TableDef[] = [
    {
        label: "App Config",
        table: "loyalty_app_config",
        description: "Core key-value settings for the loyalty app",
        columns: [
            { key: "category", label: "Category", editable: false },
            { key: "config_key", label: "Key", editable: false },
            { key: "config_value", label: "Value", editable: true, wide: true },
            { key: "value_type", label: "Type", editable: false },
            { key: "description", label: "Description", editable: false, wide: true },
            { key: "is_active", label: "Active", editable: true, type: "boolean" },
        ],
    },
    {
        label: "Daily Challenges",
        table: "loyalty_daily_challenges_config",
        description: "Challenge definitions shown to users",
        columns: [
            { key: "title", label: "Title", editable: true },
            { key: "description", label: "Description", editable: true, wide: true },
            { key: "icon_url", label: "Icon URL", editable: true, wide: true },
            { key: "challenge_type", label: "Type", editable: true },
            { key: "target_game_name", label: "Target Game", editable: true },
            { key: "target_value", label: "Target", editable: true, type: "number" },
            { key: "reward_points", label: "Reward Pts", editable: true, type: "number" },
            { key: "display_order", label: "Order", editable: true, type: "number" },
            { key: "is_active", label: "Active", editable: true, type: "boolean" },
        ],
    },
    {
        label: "Games",
        table: "loyalty_games_config",
        description: "Games available in the loyalty program",
        columns: [
            { key: "title", label: "Title", editable: true },
            { key: "image_url", label: "Image URL", editable: true, wide: true },
            { key: "game_icon_url", label: "Icon URL", editable: true, wide: true },
            { key: "package_name", label: "Package", editable: true },
            { key: "app_key_name", label: "App Key", editable: true },
            { key: "game_url", label: "Game URL", editable: true, wide: true },
            { key: "display_order", label: "Order", editable: true, type: "number" },
            { key: "is_active", label: "Active", editable: true, type: "boolean" },
        ],
    },
    {
        label: "Notifications",
        table: "notification_config",
        description: "Push notification templates",
        columns: [
            { key: "config_key", label: "Key", editable: false },
            { key: "title_template", label: "Title Template", editable: true, wide: true },
            { key: "body_template", label: "Body Template", editable: true, wide: true },
            { key: "is_active", label: "Active", editable: true, type: "boolean" },
        ],
    },
    {
        label: "Wallet",
        table: "wallet_config",
        description: "Wallet limits and parameters",
        columns: [
            { key: "key", label: "Key", editable: false },
            { key: "value", label: "Value", editable: true, type: "number" },
            { key: "description", label: "Description", editable: false, wide: true },
        ],
    },
    {
        label: "Withdrawals",
        table: "withdrawal_config",
        description: "Withdrawal rules and thresholds",
        columns: [
            { key: "key", label: "Key", editable: false },
            { key: "value", label: "Value", editable: true },
            { key: "description", label: "Description", editable: false, wide: true },
        ],
    },
    {
        label: "Withdrawal Methods",
        table: "withdrawal_methods",
        description: "Available payout methods",
        columns: [
            { key: "display_name", label: "Name", editable: true },
            { key: "method_key", label: "Key", editable: false },
            { key: "logo_asset", label: "Logo Asset", editable: true },
            { key: "logo_url", label: "Logo URL", editable: true, wide: true },
            { key: "logo_color", label: "Logo Color", editable: true },
            { key: "min_points", label: "Min Points", editable: true, type: "number" },
            { key: "sort_order", label: "Order", editable: true, type: "number" },
            { key: "badge_text", label: "Badge", editable: true },
            { key: "fields_config", label: "Fields Config", editable: true, type: "json", wide: true },
            { key: "gradient_colors", label: "Gradient Colors", editable: true, type: "json", wide: true },
            { key: "is_available", label: "Available", editable: true, type: "boolean" },
            { key: "is_coming_soon", label: "Coming Soon", editable: true, type: "boolean" },
        ],
    },
];

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type Row = Record<string, unknown>;
type TableCache = Record<string, { rows: Row[]; pk: string }>;

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export default function LoyaltyAppConfigClient() {
    const [activeTab, setActiveTab] = useState(TABLES[0].table);
    const [cache, setCache] = useState<TableCache>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    // Inline editing
    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [editBuffer, setEditBuffer] = useState<Row>({});

    // Confirmation dialog
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [pendingSave, setPendingSave] = useState<{
        table: string;
        pkValue: string;
        data: Row;
    } | null>(null);

    // Track which tabs we've already loaded
    const loadedRef = useRef(new Set<string>());

    // ── Data fetching ──────────────────────

    const fetchTable = useCallback(async (tableName: string) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(
                `/api/kpe/config/${encodeURIComponent(tableName)}`,
            );
            if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
            const json = await res.json();
            setCache((prev) => ({ ...prev, [tableName]: json }));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch on tab switch (only first time)
    useEffect(() => {
        if (!loadedRef.current.has(activeTab)) {
            loadedRef.current.add(activeTab);
            fetchTable(activeTab);
        }
    }, [activeTab, fetchTable]);

    // ── Editing helpers ────────────────────

    const startEdit = (row: Row, pk: string) => {
        setEditingKey(String(row[pk]));
        setEditBuffer({ ...row });
    };

    const cancelEdit = () => {
        setEditingKey(null);
        setEditBuffer({});
    };

    const requestSave = () => {
        const tableData = cache[activeTab];
        if (!tableData || !editingKey) return;
        const config = TABLES.find((t) => t.table === activeTab);
        if (!config) return;

        const original = tableData.rows.find(
            (r) => String(r[tableData.pk]) === editingKey,
        );
        if (!original) return;

        // Only send editable fields that actually changed
        const changes: Row = {};
        for (const col of config.columns) {
            if (col.editable && editBuffer[col.key] !== original[col.key]) {
                changes[col.key] = editBuffer[col.key];
            }
        }

        if (Object.keys(changes).length === 0) {
            cancelEdit();
            return;
        }

        setPendingSave({
            table: activeTab,
            pkValue: editingKey,
            data: changes,
        });
        setConfirmOpen(true);
    };

    const confirmSaveHandler = async () => {
        if (!pendingSave) return;
        setSaving(true);
        try {
            const res = await fetch(
                `/api/kpe/config/${encodeURIComponent(pendingSave.table)}`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        pkValue: pendingSave.pkValue,
                        data: pendingSave.data,
                    }),
                },
            );
            if (!res.ok) throw new Error(`Save failed: ${res.status}`);
            cancelEdit();
            await fetchTable(pendingSave.table);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save");
        } finally {
            setSaving(false);
            setPendingSave(null);
        }
    };

    // ── Cell renderer ─────────────────────

    const renderCell = (row: Row, col: ColDef, isEditing: boolean) => {
        const value = isEditing ? editBuffer[col.key] : row[col.key];

        if (isEditing && col.editable) {
            if (col.type === "boolean") {
                return (
                    <button
                        type="button"
                        onClick={() =>
                            setEditBuffer((prev) => ({
                                ...prev,
                                [col.key]: !prev[col.key],
                            }))
                        }
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                            value
                                ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                                : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                        }`}
                    >
                        {value ? "Yes" : "No"}
                    </button>
                );
            }
            if (col.type === "json") {
                const jsonStr =
                    typeof value === "string"
                        ? value
                        : JSON.stringify(value ?? [], null, 2);
                return (
                    <textarea
                        value={jsonStr}
                        onChange={(e) =>
                            setEditBuffer((prev) => {
                                try {
                                    return { ...prev, [col.key]: JSON.parse(e.target.value) };
                                } catch {
                                    return { ...prev, [col.key]: e.target.value };
                                }
                            })
                        }
                        rows={3}
                        className="w-full min-w-[200px] rounded-md border border-input bg-background px-3 py-1.5 text-xs font-mono"
                    />
                );
            }
            return (
                <Input
                    value={String(value ?? "")}
                    onChange={(e) => {
                        const v =
                            col.type === "number"
                                ? e.target.value === ""
                                    ? ""
                                    : Number(e.target.value)
                                : e.target.value;
                        setEditBuffer((prev) => ({
                            ...prev,
                            [col.key]: v,
                        }));
                    }}
                    type={col.type === "number" ? "number" : "text"}
                    className="h-8 text-sm min-w-[80px]"
                />
            );
        }

        // View mode
        if (col.type === "boolean") {
            return (
                <Badge variant={value ? "default" : "secondary"}>
                    {value ? "Yes" : "No"}
                </Badge>
            );
        }

        if (col.type === "json") {
            const jsonStr =
                typeof value === "string" ? value : JSON.stringify(value ?? []);
            return (
                <span className="text-xs font-mono" title={jsonStr}>
                    {jsonStr.length > 40 ? jsonStr.slice(0, 37) + "…" : jsonStr}
                </span>
            );
        }

        const display = value == null ? "—" : String(value);
        if (col.wide && display.length > 60) {
            return (
                <span className="text-sm" title={display}>
                    {display.slice(0, 57)}…
                </span>
            );
        }
        return <span className="text-sm">{display}</span>;
    };

    // ── Image preview helper ──────────────

    const ImagePreview = ({
        src,
        alt,
        className,
        fallbackClass,
    }: {
        src: unknown;
        alt: string;
        className?: string;
        fallbackClass?: string;
    }) => {
        const url = typeof src === "string" && src.trim() ? src.trim() : null;
        if (!url) {
            return (
                <div
                    className={`flex items-center justify-center bg-muted/50 ${fallbackClass ?? className ?? ""}`}
                >
                    <ImageOff className="w-6 h-6 text-muted-foreground/40" />
                </div>
            );
        }
        return (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
                src={url}
                alt={alt}
                className={className}
                onError={(e) => {
                    e.currentTarget.style.display = "none";
                    const fallback = e.currentTarget.nextElementSibling;
                    if (fallback) (fallback as HTMLElement).style.display = "flex";
                }}
            />
        );
    };

    // ── Games card renderer ───────────────

    const renderGamesCards = () => {
        const tableData = cache["loyalty_games_config"];
        if (!tableData) return null;

        const gameConfig = TABLES.find((t) => t.table === "loyalty_games_config")!;

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tableData.rows.map((row) => {
                    const pkVal = String(row[tableData.pk]);
                    const isEditing = editingKey === pkVal;
                    const data = isEditing ? editBuffer : row;

                    return (
                        <div
                            key={pkVal}
                            className={`group relative rounded-xl border overflow-hidden transition-all ${
                                isEditing
                                    ? "ring-2 ring-blue-500/50 border-blue-500/30 shadow-lg shadow-blue-500/5"
                                    : "border-border hover:border-foreground/20 hover:shadow-md"
                            }`}
                        >
                            {/* ── Banner Image ── */}
                            <div className="relative h-40 sm:h-48 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 overflow-hidden">
                                <ImagePreview
                                    src={data.image_url}
                                    alt={String(data.title ?? "Game")}
                                    className="w-full h-full object-contain"
                                    fallbackClass="w-full h-full"
                                />
                                {/* Hidden fallback for broken images */}
                                <div className="items-center justify-center bg-muted/50 w-full h-full absolute inset-0" style={{ display: "none" }}>
                                    <ImageOff className="w-10 h-10 text-muted-foreground/30" />
                                </div>

                                {/* Icon overlay (bottom-left) */}
                                <div className="absolute bottom-3 left-3 w-14 h-14 rounded-xl border-2 border-white/80 dark:border-gray-700 shadow-lg overflow-hidden bg-white dark:bg-gray-800">
                                    <ImagePreview
                                        src={data.game_icon_url}
                                        alt="Icon"
                                        className="w-full h-full object-cover"
                                        fallbackClass="w-full h-full"
                                    />
                                    <div className="items-center justify-center bg-muted/50 w-full h-full absolute inset-0" style={{ display: "none" }}>
                                        <Gamepad2 className="w-5 h-5 text-muted-foreground/40" />
                                    </div>
                                </div>

                                {/* Status badge (top-right) */}
                                <div className="absolute top-3 right-3">
                                    <Badge
                                        variant={data.is_active ? "default" : "secondary"}
                                        className={`text-xs ${
                                            data.is_active
                                                ? "bg-green-500/90 hover:bg-green-500/90 text-white"
                                                : "bg-gray-500/80 hover:bg-gray-500/80 text-white"
                                        }`}
                                    >
                                        {data.is_active ? "Active" : "Inactive"}
                                    </Badge>
                                </div>

                                {/* Edit button (top-left, on hover only in view mode) */}
                                {!isEditing && (
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        className="absolute top-3 left-3 h-8 px-3 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                                        onClick={() => startEdit(row, tableData.pk)}
                                    >
                                        <Pencil className="w-3.5 h-3.5 mr-1.5" />
                                        Edit
                                    </Button>
                                )}
                            </div>

                            {/* ── Card Body ── */}
                            <div className="p-4 space-y-3">
                                {isEditing ? (
                                    /* ── EDIT MODE ── */
                                    <div className="space-y-4">
                                        {/* Title + Active toggle */}
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1">
                                                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                                                    Title
                                                </label>
                                                <Input
                                                    value={String(editBuffer.title ?? "")}
                                                    onChange={(e) =>
                                                        setEditBuffer((prev) => ({
                                                            ...prev,
                                                            title: e.target.value,
                                                        }))
                                                    }
                                                    className="h-9"
                                                />
                                            </div>
                                            <div className="pt-5">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setEditBuffer((prev) => ({
                                                            ...prev,
                                                            is_active: !prev.is_active,
                                                        }))
                                                    }
                                                    className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                                                        editBuffer.is_active
                                                            ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                                                            : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                                                    }`}
                                                >
                                                    {editBuffer.is_active ? "Active" : "Inactive"}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Image URL with live preview */}
                                        <div>
                                            <label className="text-xs font-medium text-muted-foreground mb-1 block">
                                                Banner Image URL
                                            </label>
                                            <div className="flex gap-2">
                                                <Input
                                                    value={String(editBuffer.image_url ?? "")}
                                                    onChange={(e) =>
                                                        setEditBuffer((prev) => ({
                                                            ...prev,
                                                            image_url: e.target.value,
                                                        }))
                                                    }
                                                    placeholder="https://..."
                                                    className="h-9 flex-1"
                                                />
                                            </div>
                                            {typeof editBuffer.image_url === "string" &&
                                                editBuffer.image_url &&
                                                editBuffer.image_url !== row.image_url && (
                                                    <div className="mt-2 rounded-lg border border-dashed border-blue-500/40 bg-blue-500/5 p-2">
                                                        <p className="text-[10px] font-medium text-blue-400 mb-1.5 flex items-center gap-1">
                                                            <Eye className="w-3 h-3" />
                                                            New Image Preview
                                                        </p>
                                                        <div className="h-24 rounded-md overflow-hidden bg-muted/30">
                                                            <ImagePreview
                                                                src={editBuffer.image_url}
                                                                alt="Preview"
                                                                className="w-full h-full object-cover"
                                                                fallbackClass="w-full h-full"
                                                            />
                                                            <div className="items-center justify-center bg-muted/50 w-full h-full" style={{ display: "none" }}>
                                                                <span className="text-xs text-muted-foreground">Failed to load</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                        </div>

                                        {/* Icon URL with live preview */}
                                        <div>
                                            <label className="text-xs font-medium text-muted-foreground mb-1 block">
                                                Game Icon URL
                                            </label>
                                            <div className="flex gap-2">
                                                <Input
                                                    value={String(editBuffer.game_icon_url ?? "")}
                                                    onChange={(e) =>
                                                        setEditBuffer((prev) => ({
                                                            ...prev,
                                                            game_icon_url: e.target.value,
                                                        }))
                                                    }
                                                    placeholder="https://..."
                                                    className="h-9 flex-1"
                                                />
                                            </div>
                                            {typeof editBuffer.game_icon_url === "string" &&
                                                editBuffer.game_icon_url &&
                                                editBuffer.game_icon_url !== row.game_icon_url && (
                                                    <div className="mt-2 rounded-lg border border-dashed border-blue-500/40 bg-blue-500/5 p-2">
                                                        <p className="text-[10px] font-medium text-blue-400 mb-1.5 flex items-center gap-1">
                                                            <Eye className="w-3 h-3" />
                                                            New Icon Preview
                                                        </p>
                                                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted/30 border border-border">
                                                            <ImagePreview
                                                                src={editBuffer.game_icon_url}
                                                                alt="Icon preview"
                                                                className="w-full h-full object-cover"
                                                                fallbackClass="w-full h-full"
                                                            />
                                                            <div className="items-center justify-center bg-muted/50 w-full h-full" style={{ display: "none" }}>
                                                                <span className="text-xs text-muted-foreground">Failed</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                        </div>

                                        {/* Two-column fields */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                                                    Package Name
                                                </label>
                                                <Input
                                                    value={String(editBuffer.package_name ?? "")}
                                                    onChange={(e) =>
                                                        setEditBuffer((prev) => ({
                                                            ...prev,
                                                            package_name: e.target.value,
                                                        }))
                                                    }
                                                    className="h-9"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                                                    App Key
                                                </label>
                                                <Input
                                                    value={String(editBuffer.app_key_name ?? "")}
                                                    onChange={(e) =>
                                                        setEditBuffer((prev) => ({
                                                            ...prev,
                                                            app_key_name: e.target.value,
                                                        }))
                                                    }
                                                    className="h-9"
                                                />
                                            </div>
                                        </div>

                                        {/* Game URL */}
                                        <div>
                                            <label className="text-xs font-medium text-muted-foreground mb-1 block">
                                                Game / Store URL
                                            </label>
                                            <Input
                                                value={String(editBuffer.game_url ?? "")}
                                                onChange={(e) =>
                                                    setEditBuffer((prev) => ({
                                                        ...prev,
                                                        game_url: e.target.value,
                                                    }))
                                                }
                                                placeholder="https://play.google.com/store/apps/details?id=..."
                                                className="h-9"
                                            />
                                        </div>

                                        {/* Display Order */}
                                        <div className="w-32">
                                            <label className="text-xs font-medium text-muted-foreground mb-1 block">
                                                Display Order
                                            </label>
                                            <Input
                                                type="number"
                                                value={String(editBuffer.display_order ?? 0)}
                                                onChange={(e) =>
                                                    setEditBuffer((prev) => ({
                                                        ...prev,
                                                        display_order:
                                                            e.target.value === "" ? "" : Number(e.target.value),
                                                    }))
                                                }
                                                className="h-9"
                                            />
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 pt-1 border-t border-border">
                                            <Button size="sm" onClick={requestSave} className="h-9">
                                                <Save className="w-4 h-4 mr-1.5" />
                                                Save Changes
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={cancelEdit}
                                                className="h-9"
                                            >
                                                <X className="w-4 h-4 mr-1.5" />
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    /* ── VIEW MODE ── */
                                    <div className="space-y-2">
                                        <div className="flex items-start justify-between">
                                            <h3 className="font-semibold text-base leading-tight">
                                                {String(row.title ?? "Untitled")}
                                            </h3>
                                            <span className="text-xs text-muted-foreground tabular-nums">
                                                #{String(row.display_order ?? 0)}
                                            </span>
                                        </div>

                                        <div className="space-y-1 text-sm text-muted-foreground">
                                            <p className="font-mono text-xs truncate" title={String(row.package_name ?? "")}>
                                                {String(row.package_name ?? "—")}
                                            </p>
                                            {typeof row.app_key_name === "string" && row.app_key_name && (
                                                <p className="text-xs">
                                                    Key: <span className="font-mono">{String(row.app_key_name)}</span>
                                                </p>
                                            )}
                                        </div>

                                        {typeof row.game_url === "string" && row.game_url && (
                                            <a
                                                href={String(row.game_url)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                                            >
                                                <ExternalLink className="w-3 h-3" />
                                                Store Link
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    // ── Daily Challenges card renderer ─────────

    const renderChallengeCards = () => {
        const tableData = cache["loyalty_daily_challenges_config"];
        if (!tableData) return null;

        const challengeConfig = TABLES.find((t) => t.table === "loyalty_daily_challenges_config")!;

        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {tableData.rows.map((row) => {
                    const pk = tableData.pk;
                    const pkVal = String(row[pk]);
                    const isEditing = editingKey === pkVal;
                    const data = isEditing ? editBuffer : row;

                    const targetVal = Number(data.target_value ?? 0);
                    const rewardPts = Number(data.reward_points ?? 0);
                    // Simulate ~1.2% progress for preview
                    const sampleProgress = Math.round(targetVal * 0.012);
                    const progressPct = targetVal > 0 ? Math.min((sampleProgress / targetVal) * 100, 100) : 0;

                    return (
                        <div
                            key={pkVal}
                            className={`group relative rounded-xl border overflow-hidden transition-all ${
                                isEditing
                                    ? "ring-2 ring-blue-500/50 border-blue-500/30 shadow-lg shadow-blue-500/5"
                                    : "border-border hover:border-foreground/20 hover:shadow-md"
                            }`}
                        >
                            <div className="p-4 space-y-3">
                                {isEditing ? (
                                    /* ── EDIT MODE ── */
                                    <div className="space-y-4">
                                        {/* Title + Active toggle */}
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1">
                                                <label className="text-xs font-medium text-muted-foreground mb-1 block">Title</label>
                                                <Input
                                                    value={String(editBuffer.title ?? "")}
                                                    onChange={(e) => setEditBuffer((prev) => ({ ...prev, title: e.target.value }))}
                                                    className="h-9"
                                                />
                                            </div>
                                            <div className="pt-5">
                                                <button
                                                    type="button"
                                                    onClick={() => setEditBuffer((prev) => ({ ...prev, is_active: !prev.is_active }))}
                                                    className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                                                        editBuffer.is_active
                                                            ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                                                            : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                                                    }`}
                                                >
                                                    {editBuffer.is_active ? "Active" : "Inactive"}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <div>
                                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
                                            <Input
                                                value={String(editBuffer.description ?? "")}
                                                onChange={(e) => setEditBuffer((prev) => ({ ...prev, description: e.target.value }))}
                                                className="h-9"
                                            />
                                        </div>

                                        {/* Icon URL with live preview */}
                                        <div>
                                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Icon URL</label>
                                            <Input
                                                value={String(editBuffer.icon_url ?? "")}
                                                onChange={(e) => setEditBuffer((prev) => ({ ...prev, icon_url: e.target.value }))}
                                                placeholder="https://..."
                                                className="h-9"
                                            />
                                            {typeof editBuffer.icon_url === "string" &&
                                                editBuffer.icon_url &&
                                                editBuffer.icon_url !== row.icon_url && (
                                                    <div className="mt-2 rounded-lg border border-dashed border-blue-500/40 bg-blue-500/5 p-2">
                                                        <p className="text-[10px] font-medium text-blue-400 mb-1.5 flex items-center gap-1">
                                                            <Eye className="w-3 h-3" />
                                                            New Icon Preview
                                                        </p>
                                                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted/30 border border-border">
                                                            <ImagePreview
                                                                src={editBuffer.icon_url}
                                                                alt="Icon preview"
                                                                className="w-full h-full object-cover"
                                                                fallbackClass="w-full h-full"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                        </div>

                                        {/* Two-column: Type + Target Game */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-xs font-medium text-muted-foreground mb-1 block">Challenge Type</label>
                                                <Input
                                                    value={String(editBuffer.challenge_type ?? "")}
                                                    onChange={(e) => setEditBuffer((prev) => ({ ...prev, challenge_type: e.target.value }))}
                                                    className="h-9"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-muted-foreground mb-1 block">Target Game</label>
                                                <Input
                                                    value={String(editBuffer.target_game_name ?? "")}
                                                    onChange={(e) => setEditBuffer((prev) => ({ ...prev, target_game_name: e.target.value }))}
                                                    className="h-9"
                                                />
                                            </div>
                                        </div>

                                        {/* Three-column: Target, Reward, Order */}
                                        <div className="grid grid-cols-3 gap-3">
                                            <div>
                                                <label className="text-xs font-medium text-muted-foreground mb-1 block">Target Value</label>
                                                <Input
                                                    type="number"
                                                    value={String(editBuffer.target_value ?? 0)}
                                                    onChange={(e) => setEditBuffer((prev) => ({ ...prev, target_value: e.target.value === "" ? "" : Number(e.target.value) }))}
                                                    className="h-9"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-muted-foreground mb-1 block">Reward Points</label>
                                                <Input
                                                    type="number"
                                                    value={String(editBuffer.reward_points ?? 0)}
                                                    onChange={(e) => setEditBuffer((prev) => ({ ...prev, reward_points: e.target.value === "" ? "" : Number(e.target.value) }))}
                                                    className="h-9"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-muted-foreground mb-1 block">Order</label>
                                                <Input
                                                    type="number"
                                                    value={String(editBuffer.display_order ?? 0)}
                                                    onChange={(e) => setEditBuffer((prev) => ({ ...prev, display_order: e.target.value === "" ? "" : Number(e.target.value) }))}
                                                    className="h-9"
                                                />
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 pt-1 border-t border-border">
                                            <Button size="sm" onClick={requestSave} className="h-9">
                                                <Save className="w-4 h-4 mr-1.5" />Save Changes
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={cancelEdit} className="h-9">
                                                <X className="w-4 h-4 mr-1.5" />Cancel
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    /* ── VIEW MODE — mirroring the real app card ── */
                                    <>
                                        <div className="flex items-start gap-3">
                                            {/* Challenge icon */}
                                            <div className="w-14 h-14 rounded-xl overflow-hidden border border-border bg-muted/30 flex-shrink-0">
                                                <ImagePreview
                                                    src={data.icon_url}
                                                    alt={String(data.title ?? "Challenge")}
                                                    className="w-full h-full object-cover"
                                                    fallbackClass="w-full h-full"
                                                />
                                            </div>

                                            {/* Title + description */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <h3 className="font-semibold text-sm leading-tight">
                                                        {String(data.title ?? "Untitled")}
                                                    </h3>
                                                    {/* Reward badge — pink like the real app */}
                                                    <Badge className="bg-pink-100 dark:bg-pink-500/20 text-pink-600 dark:text-pink-400 hover:bg-pink-100 dark:hover:bg-pink-500/20 text-xs font-bold flex-shrink-0 border-0">
                                                        +{rewardPts.toLocaleString()}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                                    {String(data.description ?? "")}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Progress bar preview */}
                                        <div className="space-y-1.5">
                                            <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                                                <div
                                                    className="h-full rounded-full bg-gradient-to-r from-pink-400 to-pink-500 transition-all"
                                                    style={{ width: `${progressPct}%` }}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                                                <span className="tabular-nums">
                                                    {sampleProgress.toLocaleString()} / {targetVal.toLocaleString()} pts
                                                </span>
                                                <Badge variant="outline" className="text-[10px] h-5 px-2 rounded-full font-normal">
                                                    In Progress
                                                </Badge>
                                            </div>
                                        </div>

                                        {/* Metadata row */}
                                        <div className="flex items-center gap-2 flex-wrap text-[10px] text-muted-foreground pt-1 border-t border-border/50">
                                            <span className="flex items-center gap-1">
                                                <Target className="w-3 h-3" />
                                                {String(data.challenge_type ?? "—")}
                                            </span>
                                            <span className="text-border">•</span>
                                            <span className="flex items-center gap-1">
                                                <Gamepad2 className="w-3 h-3" />
                                                {String(data.target_game_name ?? "—")}
                                            </span>
                                            <span className="text-border">•</span>
                                            <span>#{String(data.display_order ?? 0)}</span>
                                            <div className="ml-auto flex items-center gap-1.5">
                                                <Badge
                                                    variant={data.is_active ? "default" : "secondary"}
                                                    className={`text-[10px] h-5 ${
                                                        data.is_active
                                                            ? "bg-green-500/90 hover:bg-green-500/90 text-white"
                                                            : "bg-gray-500/80 hover:bg-gray-500/80 text-white"
                                                    }`}
                                                >
                                                    {data.is_active ? "Active" : "Inactive"}
                                                </Badge>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => startEdit(row, pk)}
                                                >
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    // ── Withdrawal Methods card renderer ─────────

    /** Convert Flutter color hex (0xAARRGGBB) to CSS hex */
    const flutterColorToCss = (c: unknown): string | null => {
        if (typeof c !== "string") return null;
        const m = c.match(/^0x[0-9A-Fa-f]{2}([0-9A-Fa-f]{6})$/);
        return m ? `#${m[1]}` : null;
    };

    const renderWithdrawalCards = () => {
        const tableData = cache["withdrawal_methods"];
        if (!tableData) return null;

        const wmConfig = TABLES.find((t) => t.table === "withdrawal_methods")!;

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {tableData.rows.map((row) => {
                    const pk = tableData.pk;
                    const pkVal = String(row[pk]);
                    const isEditing = editingKey === pkVal;
                    const data = isEditing ? editBuffer : row;

                    // Parse gradient colors
                    const gradientArr = Array.isArray(data.gradient_colors) ? data.gradient_colors : [];
                    const g1 = flutterColorToCss(gradientArr[0]) ?? "#374151";
                    const g2 = flutterColorToCss(gradientArr[1]) ?? "#1f2937";

                    // Parse logo_color (used for logo tinting / fallback text color)
                    const logoCss = flutterColorToCss(data.logo_color) ?? "#ffffff";

                    // Parse fields_config
                    const fields = Array.isArray(data.fields_config) ? data.fields_config : [];

                    const badgeText = typeof data.badge_text === "string" ? data.badge_text.trim() : "";
                    const minPts = Number(data.min_points ?? 0);

                    return (
                        <div
                            key={pkVal}
                            className={`group relative rounded-xl border overflow-hidden transition-all ${
                                isEditing
                                    ? "ring-2 ring-blue-500/50 border-blue-500/30 shadow-lg shadow-blue-500/5"
                                    : "border-green-500/30 hover:border-green-400/50 hover:shadow-md"
                            }`}
                        >
                            {isEditing ? (
                                /* ── EDIT MODE ── */
                                <div className="p-4 space-y-4">
                                    {/* Name + Key */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Display Name</label>
                                            <Input
                                                value={String(editBuffer.display_name ?? "")}
                                                onChange={(e) => setEditBuffer((prev) => ({ ...prev, display_name: e.target.value }))}
                                                className="h-9"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Key</label>
                                            <Input value={String(row.method_key ?? "")} disabled className="h-9 opacity-60" />
                                        </div>
                                    </div>

                                    {/* Logo Asset + Logo URL */}
                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Logo Asset</label>
                                        <Input
                                            value={String(editBuffer.logo_asset ?? "")}
                                            onChange={(e) => setEditBuffer((prev) => ({ ...prev, logo_asset: e.target.value }))}
                                            className="h-9"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Logo URL</label>
                                        <Input
                                            value={String(editBuffer.logo_url ?? "")}
                                            onChange={(e) => setEditBuffer((prev) => ({ ...prev, logo_url: e.target.value }))}
                                            placeholder="https://..."
                                            className="h-9"
                                        />
                                        {typeof editBuffer.logo_url === "string" &&
                                            editBuffer.logo_url &&
                                            editBuffer.logo_url !== row.logo_url && (
                                                <div className="mt-2 rounded-lg border border-dashed border-blue-500/40 bg-blue-500/5 p-2">
                                                    <p className="text-[10px] font-medium text-blue-400 mb-1.5 flex items-center gap-1">
                                                        <Eye className="w-3 h-3" />New Logo Preview
                                                    </p>
                                                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-muted/30 border border-border">
                                                        <ImagePreview src={editBuffer.logo_url} alt="Logo" className="w-full h-full object-contain" fallbackClass="w-full h-full" />
                                                    </div>
                                                </div>
                                            )}
                                    </div>

                                    {/* Logo Color + Badge */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Logo Color <span className="text-[10px]">(0xAARRGGBB)</span></label>
                                            <Input
                                                value={String(editBuffer.logo_color ?? "")}
                                                onChange={(e) => setEditBuffer((prev) => ({ ...prev, logo_color: e.target.value }))}
                                                placeholder="0xFFFFFFFF"
                                                className="h-9 font-mono text-xs"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Badge Text</label>
                                            <Input
                                                value={String(editBuffer.badge_text ?? "")}
                                                onChange={(e) => setEditBuffer((prev) => ({ ...prev, badge_text: e.target.value }))}
                                                placeholder="e.g. NEW"
                                                className="h-9"
                                            />
                                        </div>
                                    </div>

                                    {/* Min Points + Sort Order */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Min Points</label>
                                            <Input
                                                type="number"
                                                value={String(editBuffer.min_points ?? 0)}
                                                onChange={(e) => setEditBuffer((prev) => ({ ...prev, min_points: e.target.value === "" ? "" : Number(e.target.value) }))}
                                                className="h-9"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Sort Order</label>
                                            <Input
                                                type="number"
                                                value={String(editBuffer.sort_order ?? 0)}
                                                onChange={(e) => setEditBuffer((prev) => ({ ...prev, sort_order: e.target.value === "" ? "" : Number(e.target.value) }))}
                                                className="h-9"
                                            />
                                        </div>
                                    </div>

                                    {/* Booleans */}
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setEditBuffer((prev) => ({ ...prev, is_available: !prev.is_available }))}
                                            className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                                                editBuffer.is_available
                                                    ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                                                    : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                                            }`}
                                        >
                                            {editBuffer.is_available ? "Available" : "Unavailable"}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setEditBuffer((prev) => ({ ...prev, is_coming_soon: !prev.is_coming_soon }))}
                                            className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                                                editBuffer.is_coming_soon
                                                    ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                                                    : "bg-gray-500/20 text-gray-400 hover:bg-gray-500/30"
                                            }`}
                                        >
                                            {editBuffer.is_coming_soon ? "Coming Soon" : "Not Coming Soon"}
                                        </button>
                                    </div>

                                    {/* Gradient Colors (JSON) */}
                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Gradient Colors <span className="text-[10px]">(JSON array)</span></label>
                                        <textarea
                                            value={typeof editBuffer.gradient_colors === "string" ? editBuffer.gradient_colors : JSON.stringify(editBuffer.gradient_colors, null, 2)}
                                            onChange={(e) => {
                                                try { setEditBuffer((prev) => ({ ...prev, gradient_colors: JSON.parse(e.target.value) })); }
                                                catch { setEditBuffer((prev) => ({ ...prev, gradient_colors: e.target.value })); }
                                            }}
                                            rows={3}
                                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        />
                                    </div>

                                    {/* Fields Config (JSON) */}
                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Fields Config <span className="text-[10px]">(JSON array)</span></label>
                                        <textarea
                                            value={typeof editBuffer.fields_config === "string" ? editBuffer.fields_config : JSON.stringify(editBuffer.fields_config, null, 2)}
                                            onChange={(e) => {
                                                try { setEditBuffer((prev) => ({ ...prev, fields_config: JSON.parse(e.target.value) })); }
                                                catch { setEditBuffer((prev) => ({ ...prev, fields_config: e.target.value })); }
                                            }}
                                            rows={4}
                                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        />
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 pt-1 border-t border-border">
                                        <Button size="sm" onClick={requestSave} className="h-9">
                                            <Save className="w-4 h-4 mr-1.5" />Save Changes
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={cancelEdit} className="h-9">
                                            <X className="w-4 h-4 mr-1.5" />Cancel
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                /* ── VIEW MODE — mirroring the real app card ── */
                                <>
                                    {/* Gradient header with logo */}
                                    <div
                                        className="relative h-32 flex items-center justify-center overflow-hidden"
                                        style={{ background: `linear-gradient(135deg, ${g1}, ${g2})` }}
                                    >
                                        {typeof data.logo_url === "string" && data.logo_url ? (
                                            /* logo_color → CSS filter: brightness(0) invert(1) makes any image a crisp
                                               white silhouette, matching Flutter's ColorFilter.mode for logo tinting */
                                            <div
                                                className="flex items-center justify-center max-h-20 max-w-[80%]"
                                                style={data.logo_color ? { filter: "brightness(0) invert(1)" } : undefined}
                                            >
                                                <ImagePreview
                                                    src={data.logo_url}
                                                    alt={String(data.display_name ?? "")}
                                                    className="max-h-20 max-w-full object-contain drop-shadow-lg"
                                                    fallbackClass="w-16 h-16"
                                                />
                                            </div>
                                        ) : (
                                            /* No logo_url — render display name styled with logo_color */
                                            <div className="flex flex-col items-center justify-center gap-1 px-4 text-center">
                                                <span
                                                    className="text-2xl font-extrabold tracking-tight drop-shadow-lg leading-none"
                                                    style={{ color: logoCss, textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}
                                                >
                                                    {String(data.display_name ?? "")}
                                                </span>
                                                <span
                                                    className="text-[10px] font-mono opacity-50"
                                                    style={{ color: logoCss }}
                                                >
                                                    {String(data.logo_asset ?? "")}
                                                </span>
                                            </div>
                                        )}

                                        {/* Badge (e.g. NEW) */}
                                        {badgeText && (
                                            <Badge className="absolute top-2.5 right-2.5 bg-green-500 hover:bg-green-500 text-white text-[10px] font-bold border-0 shadow-md">
                                                {badgeText}
                                            </Badge>
                                        )}

                                        {/* Edit button */}
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            className="absolute top-2.5 left-2.5 h-7 px-2.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-md text-xs"
                                            onClick={() => startEdit(row, pk)}
                                        >
                                            <Pencil className="w-3 h-3 mr-1" />Edit
                                        </Button>
                                    </div>

                                    {/* Card body */}
                                    <div className="p-4 space-y-2.5">
                                        <div className="flex items-start justify-between">
                                            <h3 className="font-bold text-base">{String(data.display_name ?? "Untitled")}</h3>
                                            <span className="text-[10px] text-muted-foreground">#{String(data.sort_order ?? 0)}</span>
                                        </div>

                                        <p className="text-sm text-muted-foreground font-medium">
                                            Min {minPts.toLocaleString()} pts
                                        </p>

                                        {/* Fields preview */}
                                        {fields.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5">
                                                {fields.map((f: Record<string, unknown>, i: number) => (
                                                    <Badge key={i} variant="outline" className="text-[10px] font-mono h-5 px-2">
                                                        {String(f.label ?? f.key ?? "field")}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}

                                        {/* Green progress bar (decorative, matching the app) */}
                                        <div className="h-1.5 w-full rounded-full bg-green-100 dark:bg-green-900/30 overflow-hidden">
                                            <div className="h-full w-full rounded-full bg-green-500" />
                                        </div>

                                        {/* Status row */}
                                        <div className="flex items-center gap-1.5 pt-0.5">
                                            <Badge
                                                variant={data.is_available ? "default" : "secondary"}
                                                className={`text-[10px] h-5 ${
                                                    data.is_available
                                                        ? "bg-green-500/90 hover:bg-green-500/90 text-white"
                                                        : "bg-gray-500/80 hover:bg-gray-500/80 text-white"
                                                }`}
                                            >
                                                {data.is_available ? "Available" : "Unavailable"}
                                            </Badge>
                                            {Boolean(data.is_coming_soon) && (
                                                <Badge className="text-[10px] h-5 bg-amber-500/90 hover:bg-amber-500/90 text-white border-0">
                                                    Coming Soon
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    // ── Notification card renderer ─────────

    // Sample values for template placeholder rendering
    const NOTIF_SAMPLE_VALUES: Record<string, string> = {
        coins_earned: "25",
        game_name: "tile_supreme",
        balance: "37,455",
        new_balance: "37,455",
        amount: "500",
        method: "PayPal",
        reward: "Daily Bonus",
        level: "5",
        username: "Player",
    };

    const resolveTemplate = (template: unknown): string => {
        if (typeof template !== "string") return "";
        return template.replace(/\{(\w+)\}/g, (_, key: string) => NOTIF_SAMPLE_VALUES[key] ?? `{${key}}`);
    };

    const renderNotificationCards = () => {
        const tableData = cache["notification_config"];
        if (!tableData) return null;

        const notifConfig = TABLES.find((t) => t.table === "notification_config")!;

        return (
            <div className="space-y-8">
                {tableData.rows.map((row) => {
                    const pk = tableData.pk;
                    const pkVal = String(row[pk]);
                    const isEditing = editingKey === pkVal;
                    const data = isEditing ? editBuffer : row;

                    const resolvedTitle = resolveTemplate(data.title_template);
                    const resolvedBody = resolveTemplate(data.body_template);

                    return (
                        <div key={pkVal} className="space-y-3">
                            {/* ── Row header ── */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="font-mono text-xs">
                                        {String(row.config_key ?? "")}
                                    </Badge>
                                    <Badge
                                        variant={data.is_active ? "default" : "secondary"}
                                        className={`text-[10px] ${
                                            data.is_active
                                                ? "bg-green-500/90 hover:bg-green-500/90 text-white"
                                                : "bg-gray-500/80 hover:bg-gray-500/80 text-white"
                                        }`}
                                    >
                                        {data.is_active ? "Active" : "Inactive"}
                                    </Badge>
                                </div>
                                <div>
                                    {isEditing ? (
                                        <div className="flex gap-1">
                                            <Button size="sm" className="h-8 px-2" onClick={requestSave}>
                                                <Save className="w-4 h-4" />
                                            </Button>
                                            <Button size="sm" variant="outline" className="h-8 px-2" onClick={cancelEdit}>
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 px-2"
                                            onClick={() => startEdit(row, pk)}
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* ── Edit form (when editing) ── */}
                            {isEditing && (
                                <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-4 space-y-3">
                                    {notifConfig.columns
                                        .filter((col) => col.editable)
                                        .map((col) => (
                                            <div key={col.key}>
                                                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                                                    {col.label}
                                                </label>
                                                {col.type === "boolean" ? (
                                                    <Button
                                                        variant={editBuffer[col.key] ? "default" : "outline"}
                                                        size="sm"
                                                        className="h-8"
                                                        onClick={() =>
                                                            setEditBuffer((prev) => ({
                                                                ...prev,
                                                                [col.key]: !prev[col.key],
                                                            }))
                                                        }
                                                    >
                                                        {editBuffer[col.key] ? "Yes" : "No"}
                                                    </Button>
                                                ) : (
                                                    <Input
                                                        value={String(editBuffer[col.key] ?? "")}
                                                        onChange={(e) =>
                                                            setEditBuffer((prev) => ({
                                                                ...prev,
                                                                [col.key]: e.target.value,
                                                            }))
                                                        }
                                                        className="h-9"
                                                    />
                                                )}
                                                {col.key === "body_template" && (
                                                    <p className="text-[10px] text-muted-foreground mt-1">
                                                        Placeholders: {"{"}coins_earned{"}, "}{"{"} game_name{"}, "}{"{"} balance{"}, "}{"{"} amount{"}, "}{"{"} method{"}"}…
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                </div>
                            )}

                            {/* ── Android notification preview ── */}
                            <div className="flex items-start gap-3">
                                <div className="hidden sm:flex items-center justify-center flex-shrink-0 mt-1">
                                    <Smartphone className="w-5 h-5 text-muted-foreground/60" />
                                </div>
                                <div className="flex-1 max-w-lg">
                                    <p className="text-[10px] text-muted-foreground mb-1.5 uppercase tracking-wider font-medium">
                                        Android Preview
                                    </p>
                                    {/* ── Phone notification bubble ── */}
                                    <div className="rounded-2xl bg-[#2b2d31] p-3.5 shadow-xl border border-white/5">
                                        {/* Header: icon + app name + time */}
                                        <div className="flex items-center gap-2.5 mb-2">
                                            {/* KeepPlay app icon */}
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src="https://res.cloudinary.com/destej60y/image/upload/v1773609733/KeepPlay_App_Icon_dp9wi9.png"
                                                alt="KeepPlay"
                                                className="w-9 h-9 rounded-full flex-shrink-0 shadow-md"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[11px] font-semibold text-gray-300">KeepPlay</span>
                                                    <span className="text-[10px] text-gray-500">now</span>
                                                </div>
                                            </div>
                                            {/* Expand chevron */}
                                            <svg className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M18 15l-6-6-6 6" />
                                            </svg>
                                        </div>
                                        {/* Notification content */}
                                        <div className="pl-[46px]">
                                            <p className="text-[13px] font-semibold text-gray-100 leading-snug">
                                                {resolvedTitle || <span className="text-gray-500 italic">No title</span>}
                                            </p>
                                            <p className="text-[12px] text-gray-400 leading-relaxed mt-0.5 whitespace-pre-line">
                                                {resolvedBody || <span className="text-gray-500 italic">No body</span>}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Separator */}
                            <div className="border-b border-border/50" />
                        </div>
                    );
                })}
            </div>
        );
    };

    // ── Render ─────────────────────────────

    const activeConfig = TABLES.find((t) => t.table === activeTab);

    return (
        <div className="space-y-4">
            <Tabs
                value={activeTab}
                onValueChange={(v) => {
                    cancelEdit();
                    setActiveTab(v);
                }}
            >
                {/* Horizontally scrollable tab bar for mobile */}
                <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
                    <TabsList className="inline-flex w-auto">
                        {TABLES.map((t) => (
                            <TabsTrigger
                                key={t.table}
                                value={t.table}
                                className="text-xs sm:text-sm whitespace-nowrap"
                            >
                                {t.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>

                {TABLES.map((t) => (
                    <TabsContent key={t.table} value={t.table}>
                        <Card>
                            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <div>
                                    <CardTitle className="text-lg">
                                        {t.label}
                                    </CardTitle>
                                    <CardDescription>
                                        {t.description}
                                    </CardDescription>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fetchTable(t.table)}
                                    disabled={loading}
                                >
                                    <RefreshCw
                                        className={`w-4 h-4 mr-1.5 ${loading ? "animate-spin" : ""}`}
                                    />
                                    Refresh
                                </Button>
                            </CardHeader>

                            <CardContent>
                                {loading && !cache[t.table] ? (
                                    <div className="space-y-3">
                                        {Array.from({ length: 4 }).map((_, i) => (
                                            <Skeleton
                                                key={i}
                                                className="h-10 w-full"
                                            />
                                        ))}
                                    </div>
                                ) : error && !cache[t.table] ? (
                                    <div className="text-center py-8 text-red-400">
                                        <p className="text-sm">{error}</p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="mt-3"
                                            onClick={() => fetchTable(t.table)}
                                        >
                                            Retry
                                        </Button>
                                    </div>
                                ) : cache[t.table]?.rows.length === 0 ? (
                                    <p className="text-center py-8 text-muted-foreground text-sm">
                                        No rows found.
                                    </p>
                                ) : t.table === "loyalty_games_config" ? (
                                    /* ── Games: custom card grid ── */
                                    renderGamesCards()
                                ) : t.table === "loyalty_daily_challenges_config" ? (
                                    /* ── Daily Challenges: app-style cards ── */
                                    renderChallengeCards()
                                ) : t.table === "notification_config" ? (
                                    /* ── Notifications: Android preview cards ── */
                                    renderNotificationCards()
                                ) : t.table === "withdrawal_methods" ? (
                                    /* ── Withdrawal Methods: gradient cards ── */
                                    renderWithdrawalCards()
                                ) : (
                                    <div className="overflow-x-auto -mx-6 px-6">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    {t.columns.map((col) => (
                                                        <TableHead
                                                            key={col.key}
                                                            className="text-xs whitespace-nowrap"
                                                        >
                                                            {col.label}
                                                        </TableHead>
                                                    ))}
                                                    <TableHead className="w-24 text-xs">
                                                        Actions
                                                    </TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {cache[t.table]?.rows.map(
                                                    (row) => {
                                                        const pk =
                                                            cache[t.table]!.pk;
                                                        const pkVal = String(
                                                            row[pk],
                                                        );
                                                        const isEditing =
                                                            editingKey ===
                                                            pkVal;
                                                        return (
                                                            <TableRow
                                                                key={pkVal}
                                                                className={
                                                                    isEditing
                                                                        ? "bg-blue-500/5"
                                                                        : ""
                                                                }
                                                            >
                                                                {t.columns.map(
                                                                    (col) => (
                                                                        <TableCell
                                                                            key={
                                                                                col.key
                                                                            }
                                                                        >
                                                                            {renderCell(
                                                                                row,
                                                                                col,
                                                                                isEditing,
                                                                            )}
                                                                        </TableCell>
                                                                    ),
                                                                )}
                                                                <TableCell>
                                                                    {isEditing ? (
                                                                        <div className="flex gap-1">
                                                                            <Button
                                                                                size="sm"
                                                                                className="h-8 px-2"
                                                                                onClick={
                                                                                    requestSave
                                                                                }
                                                                            >
                                                                                <Save className="w-4 h-4" />
                                                                            </Button>
                                                                            <Button
                                                                                size="sm"
                                                                                variant="outline"
                                                                                className="h-8 px-2"
                                                                                onClick={
                                                                                    cancelEdit
                                                                                }
                                                                            >
                                                                                <X className="w-4 h-4" />
                                                                            </Button>
                                                                        </div>
                                                                    ) : (
                                                                        <Button
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            className="h-8 px-2"
                                                                            onClick={() =>
                                                                                startEdit(
                                                                                    row,
                                                                                    cache[
                                                                                        t
                                                                                            .table
                                                                                    ]!
                                                                                        .pk,
                                                                                )
                                                                            }
                                                                        >
                                                                            <Pencil className="w-4 h-4" />
                                                                        </Button>
                                                                    )}
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    },
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                ))}
            </Tabs>

            {/* ── Confirmation dialog (required before any save) ── */}
            <AlertDialog
                open={confirmOpen}
                onOpenChange={(open) => {
                    setConfirmOpen(open);
                    if (!open) setPendingSave(null);
                }}
                title="Confirm Configuration Change"
                description={
                    pendingSave
                        ? `You are about to update a row in "${activeConfig?.label ?? pendingSave.table}". This change will affect the live loyalty app immediately.`
                        : ""
                }
                onConfirm={confirmSaveHandler}
                confirmText={saving ? "Saving…" : "Save Changes"}
                cancelText="Cancel"
                variant="warning"
            />

            {/* ── Floating error toast ── */}
            {error && cache[activeTab] && (
                <div className="fixed bottom-4 right-4 z-50 bg-red-900/90 text-red-100 px-4 py-3 rounded-lg shadow-lg text-sm flex items-center gap-2 max-w-sm">
                    <span className="truncate">{error}</span>
                    <button
                        onClick={() => setError(null)}
                        className="text-red-300 hover:text-white shrink-0"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
}
