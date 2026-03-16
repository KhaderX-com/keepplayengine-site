/**
 * KPE Users List API Route
 *
 * GET /api/kpe/users
 * Returns paginated, filterable list of KPE users (players).
 *
 * Query params:
 *   limit    - Page size (default: 50, max: 100)
 *   offset   - Offset for pagination (default: 0)
 *   status   - Filter by status: active, suspended, banned
 *   search   - Search by ad_id (partial match)
 *   sort_by  - Sort field: created_at, updated_at, status, platform
 *   sort_order - asc or desc (default: desc)
 */

import { NextRequest, NextResponse } from "next/server";
import { createKpeApiHandler } from "@/lib/kpe-gateway";
import { KpeUsersDAL } from "@/lib/kpe-dal";

export const GET = createKpeApiHandler(
    {
        auditResource: "kpe:users",
        auditAction: "list",
        requiredRoles: ["SUPER_ADMIN", "ADMIN"],
        rateLimit: { limit: 300, windowMs: 60000 }, // Increased limit to prevent 429 for admins
    },
    async (request: NextRequest, context) => {
        const { searchParams } = request.nextUrl;

        const limit = Math.min(
            parseInt(searchParams.get("limit") ?? "50", 10) || 50,
            100,
        );
        const offset = parseInt(searchParams.get("offset") ?? "0", 10) || 0;
        const status = searchParams.get("status") ?? undefined;
        const search = searchParams.get("search") ?? undefined;
        const sortBy = searchParams.get("sort_by") ?? "created_at";
        const sortOrder = searchParams.get("sort_order") ?? "desc";

        const { data, error } = await KpeUsersDAL.list(context.kpe, {
            limit,
            offset,
            status,
            search,
            sortBy,
            sortOrder,
        });

        if (error) {
            return NextResponse.json(
                { error: "Failed to fetch KPE users" },
                { status: 500 },
            );
        }

        return NextResponse.json(data);
    },
);
