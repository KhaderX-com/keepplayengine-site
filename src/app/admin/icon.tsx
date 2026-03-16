/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";

// Route segment config
export const runtime = "nodejs";
export const revalidate = 0;

// Image metadata
export const size = {
    width: 32,
    height: 32,
};
export const contentType = "image/png";

// Image generation
export default function Icon() {
    // Prefer the admin icon if present; fall back to the main logo.
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
        <img src={dataUri} alt="KPE Admin" width={size.width} height={size.height} />,
        { ...size }
    );
}
