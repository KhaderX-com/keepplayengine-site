import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const host = request.headers.get('host') || '';
    const isAdmin = host.includes('admin.');
    const adminV = "20260316-3";

    const manifest = {
        name: isAdmin
            ? "KeepPlay Engine - Admin Panel"
            : "KeepPlay Engine - Play-to-Earn Ecosystem",
        short_name: isAdmin ? "KPE Admin" : "KeepPlay",
        description: isAdmin
            ? "Administrative panel for KeepPlay Engine"
            : "A Play-to-Earn Ecosystem That Never Runs Dry. Build technology that engages and excites players.",
        // Bump the admin id when we need Chrome to refresh install metadata (icon, name, etc.).
        id: isAdmin ? `/admin/?v=${adminV}` : "/",
        start_url: isAdmin ? "/admin/login" : "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#2563eb",
        scope: isAdmin ? "/admin/" : "/",
        icons: [
            {
                src: isAdmin ? `/admin/pwa-icon-192?v=${adminV}` : "/keepplay-logo2.png",
                sizes: "192x192",
                type: "image/png",
                purpose: "maskable any"
            },
            {
                src: isAdmin ? `/admin/pwa-icon-512?v=${adminV}` : "/keepplay-logo2.png",
                sizes: "512x512",
                type: "image/png",
                purpose: "maskable any"
            },
            {
                src: isAdmin ? `/admin/pwa-icon-192?v=${adminV}` : "/keepplay-logo2.png",
                sizes: "192x192",
                type: "image/png",
                purpose: "any"
            },
            {
                src: isAdmin ? `/admin/pwa-icon-512?v=${adminV}` : "/keepplay-logo2.png",
                sizes: "512x512",
                type: "image/png",
                purpose: "any"
            }
        ],
        categories: isAdmin
            ? ["business", "productivity"]
            : ["business", "productivity", "entertainment"],
        orientation: isAdmin ? "portrait-primary" : "any",
        screenshots: [],
        shortcuts: isAdmin ? [] : [
            {
                name: "Admin Panel",
                short_name: "Admin",
                description: "Access the administrative panel",
                url: "/admin/login",
                icons: [
                    {
                        src: `/admin/pwa-icon-512?v=${adminV}`,
                        sizes: "512x512"
                    }
                ]
            }
        ],
        prefer_related_applications: false
    };

    return NextResponse.json(manifest, {
        headers: {
            'Content-Type': 'application/manifest+json',
            'Cache-Control': 'public, max-age=0, must-revalidate',
        },
    });
}
