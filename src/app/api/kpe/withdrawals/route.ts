/**
 * KPE Withdrawals API Routes
 *
 * GET  /api/kpe/withdrawals — Paginated list with filters
 * PATCH /api/kpe/withdrawals — Approve or reject a withdrawal
 *
 * Query params (GET):
 *   limit   - Page size (default: 50, max: 100)
 *   offset  - Offset for pagination (default: 0)
 *   status  - Filter: pending, processing, completed, failed, rejected
 *   user_id - Filter by specific user
 *   search  - Search by destination (masked email, etc.)
 */

import { NextRequest, NextResponse } from "next/server";
import { createKpeApiHandler } from "@/lib/kpe-gateway";
import { KpeWithdrawalsDAL } from "@/lib/kpe-dal";
import { sendFcmPush, renderTemplate } from "@/lib/fcm";
import { z } from "zod";

export const GET = createKpeApiHandler(
    {
        auditResource: "kpe:withdrawals",
        auditAction: "list",
        requiredRoles: ["SUPER_ADMIN", "ADMIN"],
    },
    async (request: NextRequest, context) => {
        const { searchParams } = request.nextUrl;

        const limit = Math.min(
            parseInt(searchParams.get("limit") ?? "50", 10) || 50,
            100,
        );
        const offset = parseInt(searchParams.get("offset") ?? "0", 10) || 0;
        const status = searchParams.get("status") ?? undefined;
        const userId = searchParams.get("user_id") ?? undefined;
        const search = searchParams.get("search") ?? undefined;

        const { data, error, count } = await KpeWithdrawalsDAL.list(context.kpe, {
            limit,
            offset,
            status,
            userId,
            search,
        });

        if (error) {
            return NextResponse.json(
                { error: "Failed to fetch withdrawals" },
                { status: 500 },
            );
        }

        return NextResponse.json({
            success: true,
            withdrawals: data,
            total: count ?? 0,
            limit,
            offset,
        });
    },
);

// ─────────────────────────────────────────────
// PATCH — Approve or Reject a withdrawal
// ─────────────────────────────────────────────

const patchSchema = z.object({
    withdrawal_id: z.string().uuid(),
    new_status: z.enum(["completed", "rejected"]),
    admin_notes: z.string().max(500).optional(),
    refund: z.boolean().optional(),
});

export const PATCH = createKpeApiHandler(
    {
        auditResource: "kpe:withdrawals",
        auditAction: "update_status",
        auditSeverity: "critical",
        requiredRoles: ["SUPER_ADMIN", "ADMIN"],
        bodySchema: patchSchema,
    },
    async (_request: NextRequest, context) => {
        const body = context.body as z.infer<typeof patchSchema>;

        const { data, error } = await KpeWithdrawalsDAL.updateStatus(
            context.kpe,
            body.withdrawal_id,
            body.new_status,
            body.admin_notes,
            body.refund,
        );

        if (error) {
            return NextResponse.json(
                { error: "Failed to update withdrawal status" },
                { status: 500 },
            );
        }

        const result = data as { success: boolean; error?: string };
        if (!result.success) {
            return NextResponse.json(
                { error: result.error ?? "Operation failed" },
                { status: 400 },
            );
        }

        // ── Send push notification on approval (fire-and-forget) ──
        if (body.new_status === "completed") {
            try {
                // 1. Fetch withdrawal details
                const { data: wd } = await context.kpe
                    .from("withdrawal_requests")
                    .select("user_id, method_key, amount_points")
                    .eq("id", body.withdrawal_id)
                    .single();

                if (wd) {
                    // 2. Fetch notification data (FCM token + templates)
                    const { data: notif } = await context.kpe.rpc(
                        "get_notification_data_for_user",
                        { p_user_id: wd.user_id, p_config_key: "withdrawal_approved" },
                    );

                    if (notif?.has_token) {
                        // 3. Get conversion rate + method display name
                        const [{ data: rateRow }, { data: methodRow }] =
                            await Promise.all([
                                context.kpe
                                    .from("wallet_config")
                                    .select("value")
                                    .eq("key", "conversion_rate")
                                    .single(),
                                context.kpe
                                    .from("withdrawal_methods")
                                    .select("display_name")
                                    .eq("method_key", wd.method_key)
                                    .single(),
                            ]);

                        const rate = parseFloat(rateRow?.value ?? "0.00001");
                        const amountUsd = (Number(wd.amount_points) * rate).toFixed(2);
                        const methodName =
                            methodRow?.display_name ?? wd.method_key ?? "Unknown";

                        // 4. Render templates
                        const vars = {
                            amount_usd: `$${amountUsd}`,
                            method_name: methodName,
                        };
                        const title = renderTemplate(notif.title_template, vars);
                        const body_ = renderTemplate(notif.body_template, vars);

                        // 5. Send FCM
                        const fcmResult = await sendFcmPush(
                            notif.fcm_token,
                            title,
                            body_,
                            { type: "withdrawal_approved", withdrawal_id: body.withdrawal_id },
                        );

                        // 6. Log notification
                        await context.kpe.rpc("log_notification", {
                            p_user_id: wd.user_id,
                            p_config_key: "withdrawal_approved",
                            p_title: title,
                            p_body: body_,
                            p_fcm_message_id: fcmResult.messageId ?? null,
                            p_status: fcmResult.success ? "sent" : "failed",
                            p_error_message: fcmResult.error ?? null,
                            p_metadata: {
                                withdrawal_id: body.withdrawal_id,
                                amount_usd: amountUsd,
                            },
                        });
                    }
                }
            } catch {
                // Notification failure must never block the approval response
                console.error("[withdrawals] notification send failed");
            }
        }

        return NextResponse.json(result);
    },
);
