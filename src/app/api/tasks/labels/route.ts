import { NextResponse } from "next/server";
import { createApiHandler } from "@/lib/api-gateway";
import { LabelsDAL, AdminDAL, getUserClient } from "@/lib/dal";
import { createLabelSchema } from "@/lib/schemas";

export const GET = createApiHandler(
    { skipContentType: true },
    async (_request, { session }) => {
        const client = await getUserClient(session.user.id, session.user.role);
        const { data: labels, error } = await LabelsDAL.list(client);
        if (error) throw error;
        return NextResponse.json({ labels: labels || [] });
    },
);

export const POST = createApiHandler(
    { requiredRoles: ["SUPER_ADMIN"], bodySchema: createLabelSchema },
    async (_request, { session, body, ip, userAgent }) => {
        const client = await getUserClient(session.user.id, session.user.role);
        const { data: label, error } = await LabelsDAL.create(client, {
            name: body.name.trim(),
            color: body.color || "#6B7280",
            description: body.description?.trim(),
        });

        if (error) {
            if (error.code === "23505") {
                return NextResponse.json({ error: "A label with this name already exists" }, { status: 409 });
            }
            throw error;
        }

        await AdminDAL.logActivity(client, {
            admin_user_id: session.user.id,
            action: "CREATE_LABEL",
            resource_type: "label",
            resource_id: label.id,
            description: `Created label: "${label.name}" (${label.color})`,
            ip_address: ip,
            user_agent: userAgent,
            changes: { name: label.name, color: label.color, description: label.description },
        });

        return NextResponse.json({ label }, { status: 201 });
    },
);
