import { NextResponse } from "next/server";
import { createApiHandler } from "@/lib/api-gateway";
import { getAllAdminUsers } from "@/lib/notifications";

// GET /api/notifications/recipients - Get all admin users for recipient selection
export const GET = createApiHandler({ requiredRoles: ["MODERATOR", "ADMIN", "SUPER_ADMIN"] }, async (_req, ctx) => {
    const allAdmins = await getAllAdminUsers();
    const recipients = allAdmins.filter((admin: { id: string }) => admin.id !== ctx.session.user.id);
    return NextResponse.json({ recipients });
});
