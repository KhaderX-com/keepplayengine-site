/**
 * KPEI Users API Routes
 *
 * GET    /api/kpei/users — Paginated list with search
 * DELETE /api/kpei/users — Delete a user (requires user_id in body)
 */

import { NextRequest, NextResponse } from "next/server";
import { createKpeiApiHandler } from "@/lib/kpei-gateway";
import { KpeiUsersDAL } from "@/lib/kpei-dal";
import { z } from "zod";

export const GET = createKpeiApiHandler(
    {
        auditResource: "kpei:users",
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
        const search = searchParams.get("search") ?? undefined;
        const sortBy = searchParams.get("sort_by") ?? "created_at";
        const sortOrder = searchParams.get("sort_order") ?? "desc";

        const { data, error } = await KpeiUsersDAL.list(context.kpei, {
            limit,
            offset,
            search,
            sortBy,
            sortOrder,
        });

        if (error) {
            return NextResponse.json(
                { error: "Failed to fetch users" },
                { status: 500 },
            );
        }

        return NextResponse.json(data);
    },
);

// ─────────────────────────────────────────────
// DELETE — Delete a user permanently
// ─────────────────────────────────────────────

const deleteSchema = z.object({
    user_id: z.string().uuid(),
});

export const DELETE = createKpeiApiHandler(
    {
        auditResource: "kpei:users",
        auditAction: "delete",
        auditSeverity: "critical",
        requiredRoles: ["SUPER_ADMIN"],
        bodySchema: deleteSchema,
    },
    async (_request: NextRequest, context) => {
        const body = context.body as z.infer<typeof deleteSchema>;

        const { data, error } = await KpeiUsersDAL.delete(
            context.kpei,
            body.user_id,
        );

        if (error) {
            return NextResponse.json(
                { error: "Failed to delete user" },
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

        return NextResponse.json(result);
    },
);
