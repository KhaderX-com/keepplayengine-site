import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { trimDataset, isValidDataset } from "@/lib/axiom";

export async function POST(request: NextRequest) {
    // Auth check — SUPER_ADMIN only for destructive operations
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const role = session.user.role;
    if (role !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "Forbidden — SUPER_ADMIN only" }, { status: 403 });
    }

    let body: { dataset?: string };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { dataset } = body;
    if (!dataset || !isValidDataset(dataset)) {
        return NextResponse.json(
            { error: "Invalid dataset. Allowed: keepplay-logs, game-side-reports" },
            { status: 400 },
        );
    }

    try {
        const result = await trimDataset(dataset);
        return NextResponse.json({
            success: true,
            dataset,
            trimmedBlocksCount: result.trimmedBlocksCount,
        });
    } catch (error) {
        console.error(`Dataset trim error (${dataset}):`, error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
