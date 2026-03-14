import { NextResponse } from "next/server";
import { updateSubMilestoneSchema } from "@/lib/schemas";
import { createApiHandler } from "@/lib/api-gateway";
import { getUserClient, MilestonesDAL, AdminDAL } from "@/lib/dal";

// =====================================================
// GET - Fetch single sub-milestone
// =====================================================
export const GET = createApiHandler({}, async (_req, ctx, routeContext) => {
    const { subId } = await routeContext.params;
    const client = await getUserClient(ctx.session.user.id, ctx.session.user.role);

    const { data: subMilestone, error } = await MilestonesDAL.getSubMilestone(client, subId);
    if (error || !subMilestone) {
        return NextResponse.json({ error: "Sub-milestone not found" }, { status: 404 });
    }

    return NextResponse.json({ subMilestone });
});

// =====================================================
// PATCH - Update a sub-milestone
// =====================================================
export const PATCH = createApiHandler(
    { bodySchema: updateSubMilestoneSchema, requiredRoles: ["SUPER_ADMIN", "ADMIN"] },
    async (_req, ctx, routeContext) => {
        const { subId } = await routeContext.params;
        const client = await getUserClient(ctx.session.user.id, ctx.session.user.role);
        const body = ctx.body!;

        // Get current sub-milestone
        const { data: existing, error: fetchError } = await MilestonesDAL.getSubMilestone(client, subId);
        if (fetchError || !existing) {
            return NextResponse.json({ error: "Sub-milestone not found" }, { status: 404 });
        }

        const updateData: Record<string, unknown> = {
            ...body,
            updated_at: new Date().toISOString(),
        };

        // Set completed_at when status changes to completed
        if (body.status === "completed" && existing.status !== "completed") {
            updateData.completed_at = new Date().toISOString();
            updateData.progress_percentage = 100;
        } else if (body.status && body.status !== "completed") {
            updateData.completed_at = null;
        }

        const { data: subMilestone, error } = await MilestonesDAL.updateSubMilestone(client, subId, updateData);
        if (error) {
            return NextResponse.json({ error: "Failed to update sub-milestone" }, { status: 500 });
        }

        await AdminDAL.logActivity(client, {
            admin_user_id: ctx.session.user.id,
            action: "update_sub_milestone",
            resource_type: "sub_milestone",
            resource_id: subId,
            description: `Updated sub-milestone M${subMilestone!.major_number}.${subMilestone!.minor_number}`,
            changes: body as Record<string, unknown>,
            ip_address: ctx.ip,
            user_agent: ctx.userAgent,
        });

        return NextResponse.json({ subMilestone });
    }
);

// =====================================================
// DELETE - Remove a sub-milestone
// =====================================================
export const DELETE = createApiHandler({ requiredRoles: ["SUPER_ADMIN", "ADMIN"] }, async (_req, ctx, routeContext) => {
    const { subId } = await routeContext.params;
    const client = await getUserClient(ctx.session.user.id, ctx.session.user.role);

    const { data: existing, error: fetchError } = await client
        .from("sub_milestones")
        .select("major_number, minor_number, title")
        .eq("id", subId)
        .single();

    if (fetchError || !existing) {
        return NextResponse.json({ error: "Sub-milestone not found" }, { status: 404 });
    }

    const { error } = await MilestonesDAL.deleteSubMilestone(client, subId);
    if (error) {
        return NextResponse.json({ error: "Failed to delete sub-milestone" }, { status: 500 });
    }

    await AdminDAL.logActivity(client, {
        admin_user_id: ctx.session.user.id,
        action: "delete_sub_milestone",
        resource_type: "sub_milestone",
        resource_id: subId,
        description: `Deleted sub-milestone M${existing.major_number}.${existing.minor_number}: ${existing.title}`,
        ip_address: ctx.ip,
        user_agent: ctx.userAgent,
    });

    return NextResponse.json({ success: true });
});
