/**
 * KPE Ad Revenue Analytics API Route
 *
 * GET /api/kpe/ad-revenue?view=summary|daily|by-type|by-app&from=YYYY-MM-DD&to=YYYY-MM-DD
 */

import { NextRequest, NextResponse } from "next/server";
import { createKpeApiHandler } from "@/lib/kpe-gateway";
import { KpeAdRevenueDAL } from "@/lib/kpe-dal";

export const GET = createKpeApiHandler(
    {
        auditResource: "kpe:ad-revenue",
        auditAction: "read",
        requiredRoles: ["SUPER_ADMIN", "ADMIN"],
    },
    async (request: NextRequest, context) => {
        const url = new URL(request.url);
        const view = url.searchParams.get("view") ?? "summary";
        const from = url.searchParams.get("from") ?? undefined;
        const to = url.searchParams.get("to") ?? undefined;

        const kpe = context.kpe;

        switch (view) {
            case "summary": {
                const { data, error } = await KpeAdRevenueDAL.summary(kpe, from, to);
                if (error) return NextResponse.json({ error: error.message }, { status: 500 });
                return NextResponse.json({ summary: data });
            }
            case "daily": {
                const { data, error } = await KpeAdRevenueDAL.daily(kpe, from, to);
                if (error) return NextResponse.json({ error: error.message }, { status: 500 });
                return NextResponse.json({ daily: data });
            }
            case "by-type": {
                const { data, error } = await KpeAdRevenueDAL.byType(kpe, from, to);
                if (error) return NextResponse.json({ error: error.message }, { status: 500 });
                return NextResponse.json({ byType: data });
            }
            case "by-app": {
                const { data, error } = await KpeAdRevenueDAL.byApp(kpe, from, to);
                if (error) return NextResponse.json({ error: error.message }, { status: 500 });
                return NextResponse.json({ byApp: data });
            }
            case "type-per-app": {
                const { data, error } = await KpeAdRevenueDAL.typePerApp(kpe, from, to);
                if (error) return NextResponse.json({ error: error.message }, { status: 500 });
                return NextResponse.json({ typePerApp: data });
            }
            case "chart": {
                const { data, error } = await KpeAdRevenueDAL.chart(kpe, from, to);
                if (error) return NextResponse.json({ error: error.message }, { status: 500 });
                return NextResponse.json({ chart: data });
            }
            default:
                return NextResponse.json({ error: "Invalid view parameter" }, { status: 400 });
        }
    },
);
