import { NextResponse } from "next/server";
import { createApiHandler } from "@/lib/api-gateway";
import { getUnreadCount } from "@/lib/notifications";

// GET /api/notifications/count - Get unread notification count
export const GET = createApiHandler({}, async (_req, ctx) => {
    const count = await getUnreadCount(ctx.session.user.id);
    return NextResponse.json({ unread_count: count });
});
