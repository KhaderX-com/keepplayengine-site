import { NextResponse } from "next/server";
import { pushSubscriptionSchema, deletePushSubscriptionSchema } from "@/lib/schemas";
import { createApiHandler } from "@/lib/api-gateway";
import { savePushSubscription, getUserPushSubscriptions, removePushSubscription } from "@/lib/notifications";

// GET /api/notifications/push-subscription
export const GET = createApiHandler({}, async (_req, ctx) => {
    const subscriptions = await getUserPushSubscriptions(ctx.session.user.id);
    return NextResponse.json({ subscriptions });
});

// POST /api/notifications/push-subscription
export const POST = createApiHandler(
    { bodySchema: pushSubscriptionSchema },
    async (_req, ctx) => {
        const { subscription, deviceInfo } = ctx.body!;
        const success = await savePushSubscription(ctx.session.user.id, subscription, deviceInfo);
        if (!success) {
            return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 });
        }
        return NextResponse.json({ success: true, message: "Push subscription saved successfully" });
    }
);

// DELETE /api/notifications/push-subscription
export const DELETE = createApiHandler(
    { bodySchema: deletePushSubscriptionSchema },
    async (_req, ctx) => {
        const { subscriptionId } = ctx.body!;
        const success = await removePushSubscription(ctx.session.user.id, subscriptionId);
        if (!success) {
            return NextResponse.json({ error: "Failed to remove subscription" }, { status: 500 });
        }
        return NextResponse.json({ success: true, message: "Push subscription removed" });
    }
);
