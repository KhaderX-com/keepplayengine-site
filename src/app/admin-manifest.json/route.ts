import { NextResponse } from "next/server";

// Dedicated admin manifest served from the same origin as the admin panel.
// This avoids cross-origin manifest restrictions/caching quirks and ensures
// the install prompt uses the same icon assets as the browser tab.
export async function GET() {
    const version = "20260316-3";

    const manifest = {
        name: "KeepPlay Engine - Admin Panel",
        short_name: "KPE Admin",
        description: "Administrative panel for KeepPlay Engine",
        id: "/admin/",
        start_url: "/admin/login",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#2563eb",
        scope: "/admin/",
        icons: [
            {
                src: `/admin-icon-192.png?v=${version}`,
                sizes: "192x192",
                type: "image/png",
                purpose: "maskable any",
            },
            {
                src: `/admin-icon-512.png?v=${version}`,
                sizes: "512x512",
                type: "image/png",
                purpose: "maskable any",
            },
        ],
        categories: ["business", "productivity"],
        orientation: "portrait-primary",
        screenshots: [],
        shortcuts: [
            {
                name: "Login",
                short_name: "Login",
                description: "Go to login page",
                url: "/admin/login",
                icons: [
                    {
                        src: `/admin-icon-192.png?v=${version}`,
                        sizes: "192x192",
                    },
                    {
                        src: `/admin-icon-512.png?v=${version}`,
                        sizes: "512x512",
                    },
                ],
            },
        ],
        prefer_related_applications: false,
    };

    return NextResponse.json(manifest, {
        headers: {
            // Keep the correct mime type for web app manifests.
            "Content-Type": "application/manifest+json",
            // Force revalidation so icon changes are reflected quickly.
            "Cache-Control": "public, max-age=0, must-revalidate",
        },
    });
}
