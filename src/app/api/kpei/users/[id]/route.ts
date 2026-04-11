/**
 * KPEI User Detail API
 *
 * GET   /api/kpei/users/[id] — Get full user detail
 * PATCH /api/kpei/users/[id] — Update user fields or wallet balance
 */

import { NextRequest, NextResponse } from "next/server";
import { createKpeiApiHandler } from "@/lib/kpei-gateway";
import { KpeiUsersDAL } from "@/lib/kpei-dal";
import { z } from "zod";

export const GET = createKpeiApiHandler(
    {
        auditResource: "kpei:users",
        auditAction: "get_detail",
        requiredRoles: ["SUPER_ADMIN", "ADMIN"],
    },
    async (request: NextRequest, context) => {
        const url = new URL(request.url);
        const segments = url.pathname.split("/");
        const userId = segments[segments.length - 1];

        if (!userId || !/^[0-9a-f-]{36}$/.test(userId)) {
            return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
        }

        const { data, error } = await KpeiUsersDAL.getDetail(context.kpei, userId);

        if (error) {
            return NextResponse.json(
                { error: "Failed to fetch user detail" },
                { status: 500 },
            );
        }

        const result = data as { success: boolean; error?: string };
        if (!result.success) {
            return NextResponse.json(
                { error: result.error ?? "User not found" },
                { status: 404 },
            );
        }

        return NextResponse.json(data);
    },
);

// ─────────────────────────────────────────────
// PATCH — Update user fields or wallet balance
// ─────────────────────────────────────────────

const patchSchema = z.object({
    action: z.enum(["update_profile", "update_balance"]),
    display_name: z.string().max(100).optional(),
    country_code: z.string().max(10).optional(),
    city: z.string().max(100).optional(),
    new_balance: z.number().int().min(0).optional(),
});

export const PATCH = createKpeiApiHandler(
    {
        auditResource: "kpei:users",
        auditAction: "update",
        auditSeverity: "warning",
        requiredRoles: ["SUPER_ADMIN", "ADMIN"],
        bodySchema: patchSchema,
    },
    async (request: NextRequest, context) => {
        const url = new URL(request.url);
        const segments = url.pathname.split("/");
        const userId = segments[segments.length - 1];
        const body = context.body as z.infer<typeof patchSchema>;

        if (!userId || !/^[0-9a-f-]{36}$/.test(userId)) {
            return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
        }

        if (body.action === "update_balance" && body.new_balance !== undefined) {
            const { data, error } = await KpeiUsersDAL.updateBalance(
                context.kpei,
                userId,
                body.new_balance,
            );

            if (error) {
                return NextResponse.json(
                    { error: "Failed to update balance" },
                    { status: 500 },
                );
            }

            return NextResponse.json(data);
        }

        // Default: update profile
        const { data, error } = await KpeiUsersDAL.update(context.kpei, userId, {
            display_name: body.display_name,
            country_code: body.country_code,
            city: body.city,
        });

        if (error) {
            return NextResponse.json(
                { error: "Failed to update user" },
                { status: 500 },
            );
        }

        return NextResponse.json(data);
    },
);
