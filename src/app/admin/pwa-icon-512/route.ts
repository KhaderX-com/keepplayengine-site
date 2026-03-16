import { readFileSync } from "fs";
import { join } from "path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 0;

export async function GET() {
    const preferred = join(process.cwd(), "public", "admin-icon-512.png");
    const fallback = join(process.cwd(), "public", "keepplay-logo2.png");

    let buffer: Buffer;
    try {
        buffer = readFileSync(preferred);
    } catch {
        buffer = readFileSync(fallback);
    }

    return new NextResponse(new Uint8Array(buffer), {
        headers: {
            "Content-Type": "image/png",
            "Cache-Control": "public, max-age=0, must-revalidate",
        },
    });
}
