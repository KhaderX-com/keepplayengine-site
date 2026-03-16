/**
 * KPE App Keys API Route
 *
 * GET    /api/kpe/app-keys           — List all app keys
 * POST   /api/kpe/app-keys           — Create a new app key (returns raw key ONCE)
 * PATCH  /api/kpe/app-keys           — Toggle is_active
 * DELETE /api/kpe/app-keys           — Delete an app key
 */

import { NextResponse } from "next/server";
import { createKpeApiHandler } from "@/lib/kpe-gateway";
import { KpeAppKeysDAL } from "@/lib/kpe-dal";
import { z } from "zod";
import { randomBytes, createHash } from "crypto";

// ── GET: list all app keys ───────────────────

export const GET = createKpeApiHandler(
    {
        auditResource: "kpe:app-keys",
        auditAction: "list",
        requiredRoles: ["SUPER_ADMIN"],
    },
    async (_request, context) => {
        const { data, error } = await KpeAppKeysDAL.list(context.kpe);

        if (error) {
            return NextResponse.json(
                { error: "Failed to fetch app keys" },
                { status: 500 },
            );
        }

        return NextResponse.json({ keys: data });
    },
);

// ── POST: create a new app key ───────────────

const createSchema = z.object({
    appName: z
        .string()
        .min(2, "App name must be at least 2 characters")
        .max(100)
        .regex(
            /^[a-z0-9_]+$/,
            "App name must be lowercase alphanumeric with underscores only",
        ),
    appType: z.enum(["game", "loyalty", "service", "admin"]),
});

export const POST = createKpeApiHandler(
    {
        auditResource: "kpe:app-keys",
        auditAction: "create",
        auditSeverity: "critical",
        requiredRoles: ["SUPER_ADMIN"],
        bodySchema: createSchema,
    },
    async (_request, context) => {
        const body = context.body as z.infer<typeof createSchema>;

        // Generate 48 cryptographically random bytes → base64 raw key
        const rawBytes = randomBytes(48);
        const rawKey = rawBytes.toString("base64");

        // SHA-256 hash the raw key (same algorithm as Edge Functions)
        const hash = createHash("sha256").update(rawKey).digest("hex");

        const { data, error } = await KpeAppKeysDAL.create(
            context.kpe,
            body.appName,
            body.appType,
            hash,
        );

        if (error) {
            const msg =
                error.message ?? "Failed to create app key";
            return NextResponse.json({ error: msg }, { status: 400 });
        }

        // Return the raw key — this is the ONLY time it's ever exposed
        const row = Array.isArray(data) ? data[0] : data;
        return NextResponse.json({
            key: row,
            rawKey,
        });
    },
);

// ── PATCH: toggle is_active ──────────────────

const toggleSchema = z.object({
    keyId: z.string().uuid(),
    isActive: z.boolean(),
});

export const PATCH = createKpeApiHandler(
    {
        auditResource: "kpe:app-keys",
        auditAction: "update",
        auditSeverity: "warning",
        requiredRoles: ["SUPER_ADMIN"],
        bodySchema: toggleSchema,
    },
    async (_request, context) => {
        const body = context.body as z.infer<typeof toggleSchema>;

        const { data, error } = await KpeAppKeysDAL.toggle(
            context.kpe,
            body.keyId,
            body.isActive,
        );

        if (error) {
            return NextResponse.json(
                { error: error.message ?? "Failed to toggle app key" },
                { status: 400 },
            );
        }

        return NextResponse.json({ key: Array.isArray(data) ? data[0] : data });
    },
);

// ── DELETE: remove an app key ────────────────

const deleteSchema = z.object({
    keyId: z.string().uuid(),
});

export const DELETE = createKpeApiHandler(
    {
        auditResource: "kpe:app-keys",
        auditAction: "delete",
        auditSeverity: "critical",
        requiredRoles: ["SUPER_ADMIN"],
    },
    async (request, context) => {
        // Gateway only parses body for POST/PUT/PATCH — parse manually for DELETE
        let raw: unknown;
        try {
            raw = await request.json();
        } catch {
            return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
        }
        const parsed = deleteSchema.safeParse(raw);
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
        }

        const { error } = await KpeAppKeysDAL.delete(context.kpe, parsed.data.keyId);

        if (error) {
            return NextResponse.json(
                { error: error.message ?? "Failed to delete app key" },
                { status: 400 },
            );
        }

        return NextResponse.json({ success: true });
    },
);
