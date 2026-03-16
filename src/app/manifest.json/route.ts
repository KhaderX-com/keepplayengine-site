import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const host = request.headers.get('host') || '';
    const isAdmin = host.includes('admin.');

    const manifest = {
        name: isAdmin
            ? "KeepPlay Engine - Admin Panel"
            : "KeepPlay Engine - Play-to-Earn Ecosystem",
        short_name: isAdmin ? "KPE Admin" : "KeepPlay",
        description: isAdmin
            ? "Administrative panel for KeepPlay Engine"
            : "A Play-to-Earn Ecosystem That Never Runs Dry. Build technology that engages and excites players.",
        id: isAdmin ? "/admin/" : "/",
        start_url: isAdmin ? "/admin/login" : "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#2563eb",
        scope: isAdmin ? "/admin/" : "/",
        icons: [
            {
                src: isAdmin ? "https://public-pwa.vercel.app/admin-icon-192-20260316-2.png" : "/keepplay-logo2.png",
                sizes: "192x192",
                type: "image/png",
                purpose: "maskable any"
            },
            {
                src: isAdmin ? "https://public-pwa.vercel.app/admin-icon-512-20260316-2.png" : "/keepplay-logo2.png",
                sizes: "512x512",
                type: "image/png",
                purpose: "maskable any"
            },
            {
                src: isAdmin ? "https://public-pwa.vercel.app/admin-icon-192-20260316-2.png" : "/keepplay-logo2.png",
                sizes: "192x192",
                type: "image/png",
                purpose: "any"
            },
            {
                src: isAdmin ? "https://public-pwa.vercel.app/admin-icon-512-20260316-2.png" : "/keepplay-logo2.png",
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
                        src: "https://public-pwa.vercel.app/admin-icon-512-20260316-2.png",
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
