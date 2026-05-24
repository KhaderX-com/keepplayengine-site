type PayPalEnvironment = "sandbox" | "live";

type PayPalAmount = {
    value: string;
    currency: string;
};

export type PayPalPayoutItem = {
    recipient_type: "EMAIL" | "PHONE" | "PAYPAL_ID";
    receiver: string;
    amount: PayPalAmount;
    sender_item_id: string;
    note?: string;
    recipient_wallet?: "PAYPAL" | "VENMO";
    purpose?: "GOODS" | "SERVICES" | "CASHBACK" | "REBATE" | "REFUND" | "REWARD";
};

export type CreatePayPalPayoutInput = {
    environment: PayPalEnvironment;
    senderBatchId: string;
    emailSubject: string;
    emailMessage?: string;
    items: PayPalPayoutItem[];
};

type PayPalTokenResponse = {
    access_token: string;
    token_type: string;
    expires_in: number;
    app_id?: string;
    scope?: string;
};

type CachedToken = {
    accessToken: string;
    expiresAt: number;
    appId?: string;
    scope?: string;
};

type PayPalErrorPayload = {
    name?: string;
    message?: string;
    debug_id?: string;
    information_link?: string;
    details?: Array<{ issue?: string; description?: string; field?: string }>;
    error?: string;
    error_description?: string;
};

export class PayPalApiError extends Error {
    status: number;
    payload: PayPalErrorPayload | null;

    constructor(message: string, status: number, payload: PayPalErrorPayload | null) {
        super(message);
        this.name = "PayPalApiError";
        this.status = status;
        this.payload = payload;
    }
}

const tokenCache = new Map<PayPalEnvironment, CachedToken>();

function baseUrl(environment: PayPalEnvironment) {
    return environment === "live"
        ? "https://api-m.paypal.com"
        : "https://api-m.sandbox.paypal.com";
}

function envVar(environment: PayPalEnvironment, key: "CLIENT_ID" | "CLIENT_SECRET") {
    const scopedKey = environment === "live"
        ? `PAYPAL_LIVE_${key}`
        : `PAYPAL_SANDBOX_${key}`;

    return process.env[scopedKey] ?? process.env[`PAYPAL_${key}`];
}

export function getPayPalEnvironmentConfig(environment: PayPalEnvironment) {
    const clientId = envVar(environment, "CLIENT_ID");
    const clientSecret = envVar(environment, "CLIENT_SECRET");

    return {
        environment,
        baseUrl: baseUrl(environment),
        clientId,
        clientSecret,
        configured: Boolean(clientId && clientSecret),
    };
}

export function getDefaultPayPalEnvironment(): PayPalEnvironment {
    return process.env.PAYPAL_MODE === "live" ? "live" : "sandbox";
}

async function parsePayPalResponse(response: Response) {
    const text = await response.text();
    if (!text) return null;

    try {
        return JSON.parse(text);
    } catch {
        return { message: text };
    }
}

function getPayPalErrorMessage(payload: PayPalErrorPayload | null, fallback: string) {
    return (
        payload?.message ??
        payload?.error_description ??
        payload?.details?.[0]?.description ??
        payload?.details?.[0]?.issue ??
        fallback
    );
}

function assertPayPalConfigured(environment: PayPalEnvironment) {
    const config = getPayPalEnvironmentConfig(environment);
    if (!config.clientId || !config.clientSecret) {
        throw new Error(`PayPal ${environment} credentials are not configured.`);
    }
    return config as ReturnType<typeof getPayPalEnvironmentConfig> & {
        clientId: string;
        clientSecret: string;
    };
}

export async function getPayPalAccessToken(environment: PayPalEnvironment) {
    const cached = tokenCache.get(environment);
    if (cached && cached.expiresAt > Date.now() + 60_000) {
        return cached;
    }

    const config = assertPayPalConfigured(environment);
    const basic = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64");

    const response = await fetch(`${config.baseUrl}/v1/oauth2/token`, {
        method: "POST",
        headers: {
            Authorization: `Basic ${basic}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
        cache: "no-store",
    });

    const payload = await parsePayPalResponse(response);
    if (!response.ok) {
        throw new PayPalApiError(
            getPayPalErrorMessage(payload, `PayPal OAuth failed with ${response.status}`),
            response.status,
            payload,
        );
    }

    const token = payload as PayPalTokenResponse;
    const cachedToken: CachedToken = {
        accessToken: token.access_token,
        expiresAt: Date.now() + Math.max(token.expires_in - 120, 60) * 1000,
        appId: token.app_id,
        scope: token.scope,
    };

    tokenCache.set(environment, cachedToken);
    return cachedToken;
}

export async function createPayPalPayout(input: CreatePayPalPayoutInput) {
    const config = assertPayPalConfigured(input.environment);
    const token = await getPayPalAccessToken(input.environment);
    const requestId = input.senderBatchId;

    const response = await fetch(`${config.baseUrl}/v1/payments/payouts`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token.accessToken}`,
            "Content-Type": "application/json",
            "PayPal-Request-Id": requestId,
        },
        body: JSON.stringify({
            sender_batch_header: {
                sender_batch_id: input.senderBatchId,
                email_subject: input.emailSubject,
                ...(input.emailMessage ? { email_message: input.emailMessage } : {}),
            },
            items: input.items,
        }),
        cache: "no-store",
    });

    const payload = await parsePayPalResponse(response);
    if (!response.ok) {
        throw new PayPalApiError(
            getPayPalErrorMessage(payload, `PayPal payout failed with ${response.status}`),
            response.status,
            payload,
        );
    }

    return payload;
}

export async function getPayPalPayoutBatch(environment: PayPalEnvironment, payoutBatchId: string) {
    const config = assertPayPalConfigured(environment);
    const token = await getPayPalAccessToken(environment);
    const params = new URLSearchParams({
        page: "1",
        page_size: "1000",
        total_required: "true",
    });

    const response = await fetch(
        `${config.baseUrl}/v1/payments/payouts/${encodeURIComponent(payoutBatchId)}?${params.toString()}`,
        {
            headers: {
                Authorization: `Bearer ${token.accessToken}`,
                "Content-Type": "application/json",
            },
            cache: "no-store",
        },
    );

    const payload = await parsePayPalResponse(response);
    if (!response.ok) {
        throw new PayPalApiError(
            getPayPalErrorMessage(payload, `PayPal payout lookup failed with ${response.status}`),
            response.status,
            payload,
        );
    }

    return payload;
}
