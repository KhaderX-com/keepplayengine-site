import { NextResponse } from "next/server";
import { markNotificationsReadSchema } from "@/lib/schemas";
import { createApiHandler } from "@/lib/api-gateway";
import {
    getUserNotifications,
    markNotificationsAsRead,
    getUnreadCount,
} from "@/lib/notifications";

// GET /api/notifications - Get user's notifications
export const GET = createApiHandler({}, async (req, ctx) => {
    const searchParams = new URL(req.url).searchParams;
    const limit = Math.min(Math.max(1, parseInt(searchParams.get("limit") || "20")), 100);
    const offset = Math.max(0, parseInt(searchParams.get("offset") || "0"));
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    const result = await getUserNotifications(ctx.session.user.id, { limit, offset, unreadOnly });
    return NextResponse.json(result);
});

// POST /api/notifications - Mark notifications as read
export const POST = createApiHandler(
    { bodySchema: markNotificationsReadSchema },
    async (_req, ctx) => {
        const { notificationIds } = ctx.body!;
        const count = await markNotificationsAsRead(ctx.session.user.id, notificationIds);
        const newUnreadCount = await getUnreadCount(ctx.session.user.id);
        return NextResponse.json({ success: true, marked_count: count, unread_count: newUnreadCount });
    }
);
