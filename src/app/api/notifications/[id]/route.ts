import { NextResponse } from "next/server";
import { createApiHandler } from "@/lib/api-gateway";
import { archiveNotification, deleteNotification } from "@/lib/notifications";

// DELETE /api/notifications/[id] - Delete or archive a notification
export const DELETE = createApiHandler({}, async (req, ctx, routeContext) => {
    const { id } = await routeContext.params;
    const archive = new URL(req.url).searchParams.get("archive") === "true";

    const success = archive
        ? await archiveNotification(ctx.session.user.id, id)
        : await deleteNotification(ctx.session.user.id, id);

    if (!success) {
        return NextResponse.json({ error: "Failed to delete notification" }, { status: 500 });
    }

    return NextResponse.json({
        success: true,
        message: archive ? "Notification archived" : "Notification deleted",
    });
});
