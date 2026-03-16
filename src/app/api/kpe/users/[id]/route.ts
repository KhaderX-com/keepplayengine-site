/**
 * KPE User Detail API Route
 *
 * GET /api/kpe/users/[id]
 * Returns detailed info for a specific KPE user (player),
 * including wallet, profile, transactions, withdrawals, and game earnings.
 */

import { NextRequest, NextResponse } from "next/server";
import { createKpeApiHandler } from "@/lib/kpe-gateway";
import { KpeUsersDAL } from "@/lib/kpe-dal";

export const GET = createKpeApiHandler(
    {
        auditResource: "kpe:users",
        auditAction: "get_detail",
        requiredRoles: ["SUPER_ADMIN", "ADMIN"],
    },
    async (
        _request: NextRequest,
        context,
    ) => {
        // Extract user ID from the URL path
        const url = _request.nextUrl;
        const pathParts = url.pathname.split("/");
        const userId = pathParts[pathParts.length - 1];

        if (!userId || userId.length < 10) {
            return NextResponse.json(
                { error: "Invalid user ID" },
                { status: 400 },
            );
        }

        const { data, error } = await KpeUsersDAL.getDetail(context.kpe, userId);

        if (error) {
            return NextResponse.json(
                { error: "Failed to fetch user details" },
                { status: 500 },
            );
        }

        if (!data?.success) {
            return NextResponse.json(
                { error: data?.user ? "Unknown error" : "User not found" },
                { status: 404 },
            );
        }

        return NextResponse.json(data);
    },
);
