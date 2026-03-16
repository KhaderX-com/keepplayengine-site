/**
 * KPE Config Table API Route
 *
 * GET  /api/kpe/config/[table] — List all rows for a config table
 * PUT  /api/kpe/config/[table] — Update a single row by primary key
 */

import { NextRequest, NextResponse } from "next/server";
import { createKpeApiHandler } from "@/lib/kpe-gateway";
import { KpeConfigDAL, isValidConfigTable, getConfigPk } from "@/lib/kpe-dal";
import { z } from "zod";

// ── Helpers ──────────────────────────────────

function extractTable(request: NextRequest): string {
    const parts = request.nextUrl.pathname.split("/");
    // /api/kpe/config/[table]  →  last segment
    return parts[parts.length - 1];
}

// ── GET: list all rows ───────────────────────

export const GET = createKpeApiHandler(
    {
        auditResource: "kpe:config",
        auditAction: "list",
        requiredRoles: ["SUPER_ADMIN", "ADMIN"],
    },
    async (request, context) => {
        const table = extractTable(request);

        if (!isValidConfigTable(table)) {
            return NextResponse.json(
                { error: "Invalid config table" },
                { status: 400 },
            );
        }

        const { data, error } = await KpeConfigDAL.list(context.kpe, table);

        if (error) {
            return NextResponse.json(
                { error: "Failed to fetch config rows" },
                { status: 500 },
            );
        }

        return NextResponse.json({ rows: data, pk: getConfigPk(table) });
    },
);

// ── PUT: update a single row ─────────────────

const updateSchema = z.object({
    pkValue: z.string().min(1),
    data: z.record(z.string(), z.unknown()),
});

export const PUT = createKpeApiHandler(
    {
        auditResource: "kpe:config",
        auditAction: "update",
        auditSeverity: "warning",
        requiredRoles: ["SUPER_ADMIN", "ADMIN"],
        bodySchema: updateSchema,
    },
    async (request, context) => {
        const table = extractTable(request);

        if (!isValidConfigTable(table)) {
            return NextResponse.json(
                { error: "Invalid config table" },
                { status: 400 },
            );
        }

        const body = context.body as z.infer<typeof updateSchema>;

        const { data, error } = await KpeConfigDAL.update(
            context.kpe,
            table,
            body.pkValue,
            body.data,
        );

        if (error) {
            return NextResponse.json(
                { error: "Failed to update config row" },
                { status: 500 },
            );
        }

        return NextResponse.json({ row: data });
    },
);
