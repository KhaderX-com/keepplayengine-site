import { NextResponse } from "next/server";
import { createApiHandler } from "@/lib/api-gateway";
import { LabelsDAL, AdminDAL, getUserClient } from "@/lib/dal";
import { updateLabelSchema } from "@/lib/schemas";

export const PATCH = createApiHandler(
    { requiredRoles: ["SUPER_ADMIN"], bodySchema: updateLabelSchema },
    async (_request, { session, body, ip, userAgent }, routeContext) => {
        const { id } = await (routeContext as { params: Promise<{ id: string }> }).params;
        const client = await getUserClient(session.user.id, session.user.role);

        const updates: Record<string, unknown> = {};
        if (body.name !== undefined) updates.name = body.name.trim();
        if (body.color !== undefined) updates.color = body.color;
        if (body.description !== undefined) updates.description = body.description?.trim() || null;

        const { data: label, error } = await LabelsDAL.update(client, id, updates);
        if (error) {
            if (error.code === "23505") {
                return NextResponse.json({ error: "A label with this name already exists" }, { status: 409 });
            }
            throw error;
        }
        if (!label) return NextResponse.json({ error: "Label not found" }, { status: 404 });

        await AdminDAL.logActivity(client, {
            admin_user_id: session.user.id,
            action: "UPDATE_LABEL",
            resource_type: "label",
            resource_id: id,
            description: `Updated label: "${label.name}"`,
            ip_address: ip,
            user_agent: userAgent,
            changes: updates,
        });

        return NextResponse.json({ label });
    },
);

export const DELETE = createApiHandler(
    { requiredRoles: ["SUPER_ADMIN"], skipContentType: true },
    async (_request, { session, ip, userAgent }, routeContext) => {
        const { id } = await (routeContext as { params: Promise<{ id: string }> }).params;
        const client = await getUserClient(session.user.id, session.user.role);

        // Check if label is in use
        const { count } = await LabelsDAL.getAssignmentCount(client, id);
        if (count && count > 0) {
            return NextResponse.json(
                { error: `Cannot delete label. It is currently used by ${count} task(s)` },
                { status: 409 },
            );
        }

        // Get label info for logging
        const { data: labelToDelete } = await client
            .from("task_labels")
            .select("name, color")
            .eq("id", id)
            .single();

        const { error } = await LabelsDAL.delete(client, id);
        if (error) throw error;

        await AdminDAL.logActivity(client, {
            admin_user_id: session.user.id,
            action: "DELETE_LABEL",
            resource_type: "label",
            resource_id: id,
            description: `Deleted label: "${labelToDelete?.name || "Unknown"}"`,
            ip_address: ip,
            user_agent: userAgent,
            severity: "warning",
        });

        return NextResponse.json({ success: true, message: "Label deleted successfully" });
    },
);
