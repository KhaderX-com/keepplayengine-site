/**
 * KPE Admin Audit Log API Route
 *
 * GET /api/kpe/audit
 * Returns the admin audit trail for actions performed
 * against the KPE database from the admin panel.
 *
 * Query params:
 *   limit         - Page size (default: 50, max: 100)
 *   offset        - Offset for pagination (default: 0)
 *   admin_user_id - Filter by admin user
 *   severity      - Filter: info, warning, critical
 *   resource_type - Filter by resource type (e.g., kpe:users)
 */

import { NextRequest, NextResponse } from "next/server";
import { createKpeApiHandler } from "@/lib/kpe-gateway";
import { KpeAdminAuditDAL } from "@/lib/kpe-dal";

export const GET = createKpeApiHandler(
    {
        auditResource: "kpe:audit",
        auditAction: "list",
        requiredRoles: ["SUPER_ADMIN"],
    },
    async (request: NextRequest, context) => {
        const { searchParams } = request.nextUrl;

        const limit = Math.min(
            parseInt(searchParams.get("limit") ?? "50", 10) || 50,
            100,
        );
        const offset = parseInt(searchParams.get("offset") ?? "0", 10) || 0;
        const adminUserId = searchParams.get("admin_user_id") ?? undefined;
        const severity = searchParams.get("severity") ?? undefined;
        const resourceType = searchParams.get("resource_type") ?? undefined;

        const { data, error, count } = await KpeAdminAuditDAL.list(context.kpe, {
            limit,
            offset,
            adminUserId,
            severity,
            resourceType,
        });

        if (error) {
            return NextResponse.json(
                { error: "Failed to fetch KPE audit logs" },
                { status: 500 },
            );
        }

        return NextResponse.json({
            success: true,
            logs: data,
            total: count ?? 0,
            limit,
            offset,
        });
    },
);
