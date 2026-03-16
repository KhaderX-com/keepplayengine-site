/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";

// Route segment config
export const runtime = "nodejs";
export const revalidate = 0;

// Image metadata (iOS)
export const size = {
    width: 180,
    height: 180,
};
export const contentType = "image/png";

export default function AppleIcon() {
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
