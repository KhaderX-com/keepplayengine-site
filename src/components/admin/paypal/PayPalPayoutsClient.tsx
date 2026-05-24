"use client";

import { useEffect, useMemo, useState } from "react";
import {
    AlertTriangle,
    CheckCircle2,
    Loader2,
    Plus,
    RefreshCw,
    Search,
    Send,
    Trash2,
    WalletCards,
    XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

type PayPalEnvironment = "sandbox" | "live";
type RecipientType = "EMAIL" | "PHONE" | "PAYPAL_ID";

type PayoutItem = {
    recipient_type: RecipientType;
    receiver: string;
    amount: string;
    currency: string;
    sender_item_id: string;
    note: string;
    recipient_wallet: "PAYPAL" | "VENMO";
};

type ConfigState = {
    environment: PayPalEnvironment;
    baseUrl: string;
    configured: boolean;
    clientIdSuffix: string | null;
};

type HealthState = {
    success: boolean;
    environment: PayPalEnvironment;
    configured?: boolean;
    appId?: string | null;
    hasPayoutScope?: boolean | null;
    error?: string;
};

type PayPalErrorInfo = {
    status?: number;
    name?: string | null;
    debugId?: string | null;
    informationLink?: string | null;
    details?: Array<{ issue?: string; description?: string; field?: string }>;
};

type ApiErrorBody = {
    error?: string;
    hint?: string | null;
    paypal?: PayPalErrorInfo;
};

const emptyItem = (): PayoutItem => ({
    recipient_type: "EMAIL",
    receiver: "",
    amount: "1.00",
    currency: "USD",
    sender_item_id: `item-${Date.now()}`,
    note: "KeepPlay payout",
    recipient_wallet: "PAYPAL",
});

function createBatchId() {
    const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
    return `keepplay-${stamp}-${Math.random().toString(36).slice(2, 8)}`;
}

function statusColor(status?: string) {
    switch (status) {
        case "SUCCESS":
            return "bg-emerald-50 text-emerald-700 border-emerald-200";
        case "PENDING":
        case "PROCESSING":
            return "bg-amber-50 text-amber-700 border-amber-200";
        case "DENIED":
        case "FAILED":
        case "CANCELED":
            return "bg-red-50 text-red-700 border-red-200";
        default:
            return "bg-gray-50 text-gray-700 border-gray-200";
    }
}

const primaryButtonClass = "rounded-lg bg-gray-900 !text-white hover:bg-black disabled:bg-gray-200 disabled:!text-gray-500 disabled:opacity-100 [&_svg]:!text-current";
const blueButtonClass = "rounded-lg bg-blue-700 !text-white hover:bg-blue-800 disabled:bg-blue-100 disabled:!text-blue-400 disabled:opacity-100 [&_svg]:!text-current";
const outlineButtonClass = "rounded-lg border-gray-200 bg-white !text-gray-900 hover:bg-gray-50 hover:!text-gray-900 disabled:bg-gray-100 disabled:!text-gray-400 disabled:opacity-100 [&_svg]:!text-current";

export default function PayPalPayoutsClient() {
    const [environment, setEnvironment] = useState<PayPalEnvironment>("sandbox");
    const [config, setConfig] = useState<ConfigState | null>(null);
    const [health, setHealth] = useState<HealthState | null>(null);
    const [configLoading, setConfigLoading] = useState(false);
    const [healthLoading, setHealthLoading] = useState(false);

    const [senderBatchId, setSenderBatchId] = useState(createBatchId);
    const [emailSubject, setEmailSubject] = useState("You have a KeepPlay payout");
    const [emailMessage, setEmailMessage] = useState("Your KeepPlay payout has been sent.");
    const [liveConfirmation, setLiveConfirmation] = useState("");
    const [items, setItems] = useState<PayoutItem[]>([emptyItem()]);
    const [createLoading, setCreateLoading] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);
    const [createHint, setCreateHint] = useState<string | null>(null);
    const [createPaypalError, setCreatePaypalError] = useState<PayPalErrorInfo | null>(null);
    const [createResult, setCreateResult] = useState<Record<string, unknown> | null>(null);

    const [lookupBatchId, setLookupBatchId] = useState("");
    const [lookupLoading, setLookupLoading] = useState(false);
    const [lookupError, setLookupError] = useState<string | null>(null);
    const [lookupPaypalError, setLookupPaypalError] = useState<PayPalErrorInfo | null>(null);
    const [lookupResult, setLookupResult] = useState<Record<string, unknown> | null>(null);

    const total = useMemo(() => {
        return items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    }, [items]);

    const loadConfig = async () => {
        setConfigLoading(true);
        setHealth(null);
        try {
            const response = await fetch(`/api/admin/paypal-payouts?action=config&environment=${environment}`);
            const json = await response.json();
            if (!response.ok) throw new Error(json.error ?? "Failed to load PayPal config");
            setConfig(json);
        } catch (error) {
            setConfig(null);
            setHealth({
                success: false,
                environment,
                error: error instanceof Error ? error.message : "Failed to load PayPal config",
            });
        } finally {
            setConfigLoading(false);
        }
    };

    const runHealthCheck = async () => {
        setHealthLoading(true);
        setHealth(null);
        try {
            const response = await fetch(`/api/admin/paypal-payouts?action=health&environment=${environment}`);
            const json = await response.json();
            if (!response.ok) throw new Error(json.error ?? "PayPal connection failed");
            setHealth(json);
        } catch (error) {
            setHealth({
                success: false,
                environment,
                error: error instanceof Error ? error.message : "PayPal connection failed",
            });
        } finally {
            setHealthLoading(false);
        }
    };

    useEffect(() => {
        void loadConfig();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [environment]);

    const updateItem = (index: number, patch: Partial<PayoutItem>) => {
        setItems((current) => current.map((item, i) => (i === index ? { ...item, ...patch } : item)));
    };

    const removeItem = (index: number) => {
        setItems((current) => current.filter((_, i) => i !== index));
    };

    const createPayout = async () => {
        setCreateLoading(true);
        setCreateError(null);
        setCreateHint(null);
        setCreatePaypalError(null);
        setCreateResult(null);

        try {
            const payload = {
                environment,
                senderBatchId,
                emailSubject,
                emailMessage: emailMessage || undefined,
                liveConfirmation: environment === "live" ? liveConfirmation : undefined,
                items: items.map((item) => ({
                    recipient_type: item.recipient_type,
                    receiver: item.receiver,
                    amount: {
                        value: Number(item.amount).toFixed(2),
                        currency: item.currency.toUpperCase(),
                    },
                    sender_item_id: item.sender_item_id,
                    note: item.note || undefined,
                    recipient_wallet: item.recipient_wallet,
                })),
            };

            const response = await fetch("/api/admin/paypal-payouts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const json = await response.json();
            if (!response.ok || !json.success) {
                const apiError = json as ApiErrorBody;
                setCreateError(apiError.error ?? "Payout failed");
                setCreateHint(apiError.hint ?? null);
                setCreatePaypalError(apiError.paypal ?? null);
                return;
            }

            setCreateResult(json.payout);
            const batchId = json.payout?.batch_header?.payout_batch_id;
            if (batchId) setLookupBatchId(batchId);
            setSenderBatchId(createBatchId());
        } catch (error) {
            setCreateError(error instanceof Error ? error.message : "Payout failed");
        } finally {
            setCreateLoading(false);
        }
    };

    const lookupBatch = async () => {
        if (!lookupBatchId.trim()) return;

        setLookupLoading(true);
        setLookupError(null);
        setLookupPaypalError(null);
        setLookupResult(null);
        try {
            const params = new URLSearchParams({
                action: "batch",
                environment,
                batch_id: lookupBatchId.trim(),
            });
            const response = await fetch(`/api/admin/paypal-payouts?${params.toString()}`);
            const json = await response.json();
            if (!response.ok || !json.success) {
                const apiError = json as ApiErrorBody;
                setLookupError(apiError.error ?? "Lookup failed");
                setLookupPaypalError(apiError.paypal ?? null);
                return;
            }
            setLookupResult(json.batch);
        } catch (error) {
            setLookupError(error instanceof Error ? error.message : "Lookup failed");
        } finally {
            setLookupLoading(false);
        }
    };

    const createdBatchHeader = createResult?.batch_header as
        | { payout_batch_id?: string; batch_status?: string }
        | undefined;
    const lookupBatchHeader = lookupResult?.batch_header as
        | { payout_batch_id?: string; batch_status?: string; amount?: { value?: string; currency?: string }; fees?: { value?: string; currency?: string } }
        | undefined;
    const lookupItems = Array.isArray(lookupResult?.items) ? lookupResult.items : [];

    return (
        <div className="max-w-7xl mx-auto space-y-5">
            <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
                <section className="bg-white border border-gray-200 rounded-lg p-4 sm:p-5 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <WalletCards className="w-5 h-5 text-blue-700" />
                                <h2 className="text-lg font-bold text-gray-900">PayPal API</h2>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                                {config?.baseUrl ?? "Loading PayPal endpoint"}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <select
                                value={environment}
                                onChange={(event) => setEnvironment(event.target.value as PayPalEnvironment)}
                                className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-800"
                            >
                                <option value="sandbox">Sandbox</option>
                                <option value="live">Live</option>
                            </select>
                            <Button variant="outline" onClick={loadConfig} disabled={configLoading} className={`h-10 ${outlineButtonClass}`}>
                                {configLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                            </Button>
                        </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3 mt-5">
                        <div className="border border-gray-200 rounded-lg p-3">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Environment</p>
                            <p className="text-sm font-bold text-gray-900 mt-1 capitalize">{environment}</p>
                        </div>
                        <div className="border border-gray-200 rounded-lg p-3">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Credentials</p>
                            <div className="mt-1">
                                {config?.configured ? (
                                    <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-50">
                                        Configured {config.clientIdSuffix ? `...${config.clientIdSuffix}` : ""}
                                    </Badge>
                                ) : (
                                    <Badge className="bg-red-50 text-red-700 border border-red-200 hover:bg-red-50">Missing</Badge>
                                )}
                            </div>
                        </div>
                        <div className="border border-gray-200 rounded-lg p-3">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">OAuth</p>
                            <div className="mt-1 flex items-center gap-2">
                                {health?.success ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                ) : health ? (
                                    <XCircle className="w-4 h-4 text-red-600" />
                                ) : (
                                    <span className="w-4 h-4 rounded-full border border-gray-300" />
                                )}
                                <span className="text-sm font-semibold text-gray-800">
                                    {health?.success ? "Connected" : health ? "Failed" : "Not checked"}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
                        <Button onClick={runHealthCheck} disabled={healthLoading} className={primaryButtonClass}>
                            {healthLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                            Test Connection
                        </Button>
                        {health?.appId && (
                            <p className="text-sm text-gray-500">
                                App ID <span className="font-mono text-gray-800">{health.appId}</span>
                            </p>
                        )}
                    </div>

                    {health?.error && (
                        <div className="mt-4 border border-red-200 bg-red-50 rounded-lg p-3 text-sm text-red-700 flex gap-2">
                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>{health.error}</span>
                        </div>
                    )}
                </section>

                <section className="bg-white border border-gray-200 rounded-lg p-4 sm:p-5 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-900">Batch Lookup</h2>
                    <div className="mt-4 space-y-3">
                        <div>
                            <Label htmlFor="batch-lookup" className="text-xs font-semibold text-gray-600">Payout Batch ID</Label>
                            <Input
                                id="batch-lookup"
                                value={lookupBatchId}
                                onChange={(event) => setLookupBatchId(event.target.value)}
                                placeholder="Y4JB5BNLE8Z88"
                                className="mt-1 rounded-lg"
                            />
                        </div>
                        <Button onClick={lookupBatch} disabled={lookupLoading || !lookupBatchId.trim()} className={`w-full ${primaryButtonClass}`}>
                            {lookupLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
                            Lookup Batch
                        </Button>
                    </div>
                    {lookupError && (
                        <div className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 space-y-1">
                            <p>{lookupError}</p>
                            {lookupPaypalError?.debugId && (
                                <p className="font-mono text-xs">PayPal debug ID: {lookupPaypalError.debugId}</p>
                            )}
                        </div>
                    )}
                    {lookupBatchHeader && (
                        <div className="mt-4 border border-gray-200 rounded-lg divide-y divide-gray-100">
                            <div className="p-3 flex items-center justify-between gap-3">
                                <span className="text-xs text-gray-500 font-semibold">Status</span>
                                <Badge className={`${statusColor(lookupBatchHeader.batch_status)} hover:bg-inherit`}>
                                    {lookupBatchHeader.batch_status ?? "Unknown"}
                                </Badge>
                            </div>
                            <div className="p-3 flex items-center justify-between gap-3">
                                <span className="text-xs text-gray-500 font-semibold">Amount</span>
                                <span className="text-sm font-bold text-gray-900">
                                    {lookupBatchHeader.amount?.value ?? "-"} {lookupBatchHeader.amount?.currency ?? ""}
                                </span>
                            </div>
                            <div className="p-3 flex items-center justify-between gap-3">
                                <span className="text-xs text-gray-500 font-semibold">Items</span>
                                <span className="text-sm font-bold text-gray-900">{lookupItems.length}</span>
                            </div>
                        </div>
                    )}
                </section>
            </div>

            <section className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-gray-200 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Create Batch Payout</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {items.length} item{items.length === 1 ? "" : "s"} · {total.toFixed(2)} {items[0]?.currency || "USD"}
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => setItems((current) => [...current, emptyItem()])}
                        className={outlineButtonClass}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Recipient
                    </Button>
                </div>

                <div className="p-4 sm:p-5 space-y-5">
                    <div className="grid gap-4 lg:grid-cols-3">
                        <div>
                            <Label htmlFor="sender-batch-id" className="text-xs font-semibold text-gray-600">Sender Batch ID</Label>
                            <Input
                                id="sender-batch-id"
                                value={senderBatchId}
                                onChange={(event) => setSenderBatchId(event.target.value)}
                                className="mt-1 rounded-lg"
                            />
                        </div>
                        <div>
                            <Label htmlFor="email-subject" className="text-xs font-semibold text-gray-600">Email Subject</Label>
                            <Input
                                id="email-subject"
                                value={emailSubject}
                                onChange={(event) => setEmailSubject(event.target.value)}
                                className="mt-1 rounded-lg"
                            />
                        </div>
                        <div>
                            <Label htmlFor="email-message" className="text-xs font-semibold text-gray-600">Email Message</Label>
                            <Input
                                id="email-message"
                                value={emailMessage}
                                onChange={(event) => setEmailMessage(event.target.value)}
                                className="mt-1 rounded-lg"
                            />
                        </div>
                    </div>

                    {environment === "live" && (
                        <div className="border border-amber-200 bg-amber-50 rounded-lg p-4">
                            <Label htmlFor="live-confirmation" className="text-xs font-semibold text-amber-800">
                                Live Confirmation
                            </Label>
                            <Input
                                id="live-confirmation"
                                value={liveConfirmation}
                                onChange={(event) => setLiveConfirmation(event.target.value)}
                                placeholder="SEND LIVE PAYOUT"
                                className="mt-1 rounded-lg bg-white border-amber-200"
                            />
                        </div>
                    )}

                    <div className="space-y-3">
                        {items.map((item, index) => (
                            <div key={`${item.sender_item_id}-${index}`} className="border border-gray-200 rounded-lg p-4">
                                <div className="grid gap-3 lg:grid-cols-[130px_1fr_130px_90px_140px_44px]">
                                    <div>
                                        <Label className="text-xs font-semibold text-gray-600">Type</Label>
                                        <select
                                            value={item.recipient_type}
                                            onChange={(event) => updateItem(index, { recipient_type: event.target.value as RecipientType })}
                                            className="mt-1 h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800"
                                        >
                                            <option value="EMAIL">Email</option>
                                            <option value="PAYPAL_ID">PayPal ID</option>
                                            <option value="PHONE">Phone</option>
                                        </select>
                                    </div>
                                    <div>
                                        <Label className="text-xs font-semibold text-gray-600">Receiver</Label>
                                        <Input
                                            value={item.receiver}
                                            onChange={(event) => updateItem(index, { receiver: event.target.value })}
                                            placeholder="recipient@example.com"
                                            className="mt-1 rounded-lg"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs font-semibold text-gray-600">Amount</Label>
                                        <Input
                                            value={item.amount}
                                            inputMode="decimal"
                                            onChange={(event) => updateItem(index, { amount: event.target.value })}
                                            className="mt-1 rounded-lg"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs font-semibold text-gray-600">Currency</Label>
                                        <Input
                                            value={item.currency}
                                            maxLength={3}
                                            onChange={(event) => updateItem(index, { currency: event.target.value.toUpperCase() })}
                                            className="mt-1 rounded-lg uppercase"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs font-semibold text-gray-600">Sender Item ID</Label>
                                        <Input
                                            value={item.sender_item_id}
                                            onChange={(event) => updateItem(index, { sender_item_id: event.target.value })}
                                            className="mt-1 rounded-lg"
                                        />
                                    </div>
                                    <div className="flex items-end">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => removeItem(index)}
                                            disabled={items.length === 1}
                                            className="rounded-lg border-gray-200 bg-white !text-red-600 hover:bg-red-50 hover:!text-red-700 disabled:bg-gray-100 disabled:!text-gray-400 disabled:opacity-100 [&_svg]:!text-current"
                                            aria-label="Remove recipient"
                                        >
                                            <Trash2 className="w-4 h-4 text-red-600" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="grid gap-3 lg:grid-cols-[170px_1fr] mt-3">
                                    <div>
                                        <Label className="text-xs font-semibold text-gray-600">Wallet</Label>
                                        <select
                                            value={item.recipient_wallet}
                                            onChange={(event) => updateItem(index, { recipient_wallet: event.target.value as "PAYPAL" | "VENMO" })}
                                            className="mt-1 h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800"
                                        >
                                            <option value="PAYPAL">PayPal</option>
                                            <option value="VENMO">Venmo</option>
                                        </select>
                                    </div>
                                    <div>
                                        <Label className="text-xs font-semibold text-gray-600">Note</Label>
                                        <Input
                                            value={item.note}
                                            onChange={(event) => updateItem(index, { note: event.target.value })}
                                            className="mt-1 rounded-lg"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {createError && (
                        <div className="border border-red-200 bg-red-50 rounded-lg p-4 text-sm text-red-700 flex gap-3">
                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                            <div className="space-y-2">
                                <p className="font-semibold">{createError}</p>
                                {createPaypalError?.name && (
                                    <p>
                                        PayPal error: <span className="font-mono">{createPaypalError.name}</span>
                                        {createPaypalError.status ? ` · HTTP ${createPaypalError.status}` : ""}
                                    </p>
                                )}
                                {createPaypalError?.debugId && (
                                    <p>
                                        PayPal debug ID: <span className="font-mono">{createPaypalError.debugId}</span>
                                    </p>
                                )}
                                {createPaypalError?.details?.map((detail, index) => (
                                    <p key={`${detail.issue ?? "detail"}-${index}`}>
                                        {detail.issue && <span className="font-mono">{detail.issue}</span>}
                                        {detail.description ? `: ${detail.description}` : ""}
                                    </p>
                                ))}
                                {createHint && <p className="text-red-800">{createHint}</p>}
                                {createPaypalError?.informationLink && (
                                    <a
                                        href={createPaypalError.informationLink}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-block font-semibold underline underline-offset-2"
                                    >
                                        Open PayPal error reference
                                    </a>
                                )}
                            </div>
                        </div>
                    )}

                    {createdBatchHeader && (
                        <div className="border border-emerald-200 bg-emerald-50 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                                <p className="text-sm font-bold text-emerald-900">Payout batch created</p>
                                <p className="text-sm text-emerald-700 font-mono mt-1">{createdBatchHeader.payout_batch_id}</p>
                            </div>
                            <Badge className={`${statusColor(createdBatchHeader.batch_status)} hover:bg-inherit`}>
                                {createdBatchHeader.batch_status ?? "Unknown"}
                            </Badge>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
                        <p className="text-xs text-gray-500">
                            Live payouts are restricted to SUPER_ADMIN and require typed confirmation.
                        </p>
                        <Button
                            onClick={createPayout}
                            disabled={createLoading || !config?.configured}
                            className={blueButtonClass}
                        >
                            {createLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                            Send Payout Batch
                        </Button>
                    </div>
                </div>
            </section>
        </div>
    );
}
