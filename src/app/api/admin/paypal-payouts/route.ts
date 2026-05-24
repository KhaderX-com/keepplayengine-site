import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createApiHandler } from "@/lib/api-gateway";
import {
    createPayPalPayout,
    getDefaultPayPalEnvironment,
    getPayPalAccessToken,
    getPayPalEnvironmentConfig,
    getPayPalPayoutBatch,
    PayPalApiError,
} from "@/lib/paypal-payouts";

const environmentSchema = z.enum(["sandbox", "live"]);

const payoutItemSchema = z.object({
    recipient_type: z.enum(["EMAIL", "PHONE", "PAYPAL_ID"]),
    receiver: z.string().trim().min(3).max(254),
    amount: z.object({
        value: z.string().regex(/^\d+(\.\d{1,2})?$/),
        currency: z.string().trim().length(3).transform((value) => value.toUpperCase()),
    }),
    sender_item_id: z.string().trim().min(1).max(127),
    note: z.string().trim().max(4000).optional(),
    recipient_wallet: z.enum(["PAYPAL", "VENMO"]).optional(),
    purpose: z.enum(["GOODS", "SERVICES", "CASHBACK", "REBATE", "REFUND", "REWARD"]).optional(),
});

const createPayoutSchema = z.object({
    environment: environmentSchema.default("sandbox"),
    senderBatchId: z.string().trim().min(3).max(127),
    emailSubject: z.string().trim().min(1).max(255),
    emailMessage: z.string().trim().max(1000).optional(),
    items: z.array(payoutItemSchema).min(1).max(100),
    liveConfirmation: z.string().optional(),
}).superRefine((value, ctx) => {
    if (value.environment === "live" && value.liveConfirmation !== "SEND LIVE PAYOUT") {
        ctx.addIssue({
            code: "custom",
            path: ["liveConfirmation"],
            message: "Live payouts require confirmation.",
        });
    }
});

function safeError(error: unknown) {
    return error instanceof Error ? error.message : "PayPal request failed";
}

function paypalErrorResponse(error: unknown, fallbackStatus = 502) {
    if (error instanceof PayPalApiError) {
        const issue = error.payload?.name ?? error.payload?.details?.[0]?.issue ?? null;
        const isAuthorizationError =
            issue === "AUTHORIZATION_ERROR" ||
            issue === "PERMISSION_DENIED" ||
            error.status === 403;

        return NextResponse.json(
            {
                success: false,
                error: error.message,
                paypal: {
                    status: error.status,
                    name: error.payload?.name ?? null,
                    debugId: error.payload?.debug_id ?? null,
                    informationLink: error.payload?.information_link ?? null,
                    details: error.payload?.details ?? [],
                },
                hint: isAuthorizationError
                    ? "PayPal accepted the credentials, but this live business account is not authorized to create Payouts yet. Confirm live Payouts access, confirmed identity/email/bank account, account restrictions, and available PayPal balance."
                    : null,
            },
            { status: fallbackStatus },
        );
    }

    return NextResponse.json(
        { success: false, error: safeError(error) },
        { status: fallbackStatus },
    );
}

export const GET = createApiHandler(
    {
        requiredRoles: ["SUPER_ADMIN", "ADMIN"],
    },
    async (request: NextRequest) => {
        const environment = environmentSchema.safeParse(
            request.nextUrl.searchParams.get("environment") ?? getDefaultPayPalEnvironment(),
        );

        if (!environment.success) {
            return NextResponse.json({ error: "Invalid PayPal environment" }, { status: 400 });
        }

        const action = request.nextUrl.searchParams.get("action") ?? "config";
        const config = getPayPalEnvironmentConfig(environment.data);

        if (action === "config") {
            return NextResponse.json({
                environment: config.environment,
                baseUrl: config.baseUrl,
                configured: config.configured,
                clientIdSuffix: config.clientId ? config.clientId.slice(-6) : null,
            });
        }

        if (action === "health") {
            try {
                const token = await getPayPalAccessToken(environment.data);
                return NextResponse.json({
                    success: true,
                    environment: environment.data,
                    configured: true,
                    appId: token.appId ?? null,
                    hasPayoutScope: token.scope?.includes("payouts") ?? null,
                });
            } catch (error) {
                return paypalErrorResponse(error);
            }
        }

        if (action === "batch") {
            const batchId = request.nextUrl.searchParams.get("batch_id");
            if (!batchId) {
                return NextResponse.json({ error: "batch_id is required" }, { status: 400 });
            }

            try {
                const batch = await getPayPalPayoutBatch(environment.data, batchId);
                return NextResponse.json({ success: true, batch });
            } catch (error) {
                return paypalErrorResponse(error);
            }
        }

        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    },
);

export const POST = createApiHandler(
    {
        requiredRoles: ["SUPER_ADMIN"],
        bodySchema: createPayoutSchema,
    },
    async (_request: NextRequest, context) => {
        const body = context.body as z.infer<typeof createPayoutSchema>;

        try {
            const payout = await createPayPalPayout({
                environment: body.environment,
                senderBatchId: body.senderBatchId,
                emailSubject: body.emailSubject,
                emailMessage: body.emailMessage,
                items: body.items,
            });

            return NextResponse.json({ success: true, payout }, { status: 201 });
        } catch (error) {
            return paypalErrorResponse(error);
        }
    },
);
