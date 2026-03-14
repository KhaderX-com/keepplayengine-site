import { NextResponse } from "next/server";
import { createApiHandler } from "@/lib/api-gateway";
import { getSentNotifications } from "@/lib/notifications";

// GET /api/notifications/sent - Get notifications sent by the current user
export const GET = createApiHandler({}, async (req, ctx) => {
    const searchParams = new URL(req.url).searchParams;
    const limit = Math.min(Math.max(1, parseInt(searchParams.get("limit") || "50")), 100);
    const offset = Math.max(0, parseInt(searchParams.get("offset") || "0"));

    const result = await getSentNotifications(ctx.session.user.id, { limit, offset });
    return NextResponse.json(result);
});
