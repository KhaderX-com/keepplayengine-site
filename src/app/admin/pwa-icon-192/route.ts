import { ImageResponse } from "next/og";
import React from "react";
import { readFileSync } from "fs";
import { join } from "path";

export const runtime = "nodejs";
export const revalidate = 0;

const size = { width: 192, height: 192 };

export async function GET() {
    const preferred = join(process.cwd(), "public", "admin-icon-512.png");
    const fallback = join(process.cwd(), "public", "keepplay-logo2.png");

    let buffer: Buffer;
    try {
        buffer = readFileSync(preferred);
    } catch {
        buffer = readFileSync(fallback);
    }

    const base64 = buffer.toString("base64");
    const dataUri = `data:image/png;base64,${base64}`;

    return new ImageResponse(
        React.createElement("img", {
            src: dataUri,
            alt: "KPE Admin",
            width: size.width,
            height: size.height,
        }),
        { ...size }
    );
}
