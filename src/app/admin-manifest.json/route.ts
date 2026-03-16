import { NextResponse } from "next/server";

const MAIN_SITE_ORIGIN = "https://keepplayengine.com";
const ADMIN_SITE_ORIGIN = "https://admin.keepplayengine.com";
const ADMIN_ICON_VERSION = "20260316-7";

export async function GET() {
    const manifest = {
        name: "KeepPlay Engine - Admin Panel",
        short_name: "KPE Admin",
        description: "Administrative panel for KeepPlay Engine",
        id: `${ADMIN_SITE_ORIGIN}/admin/`,
        start_url: `${ADMIN_SITE_ORIGIN}/admin/login`,
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#2563eb",
        scope: `${ADMIN_SITE_ORIGIN}/`,
        icons: [
            {
                src: `${MAIN_SITE_ORIGIN}/admin-icon-192.png?v=${ADMIN_ICON_VERSION}`,
                sizes: "192x192",
                type: "image/png",
                purpose: "maskable any",
            },
            {
                src: `${MAIN_SITE_ORIGIN}/admin-icon-512.png?v=${ADMIN_ICON_VERSION}`,
                sizes: "512x512",
                type: "image/png",
                purpose: "maskable any",
            },
            {
                src: `${MAIN_SITE_ORIGIN}/admin-icon-192.png?v=${ADMIN_ICON_VERSION}`,
                sizes: "192x192",
                type: "image/png",
                purpose: "any",
            },
            {
                src: `${MAIN_SITE_ORIGIN}/admin-icon-512.png?v=${ADMIN_ICON_VERSION}`,
                sizes: "512x512",
                type: "image/png",
                purpose: "any",
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
                url: `${ADMIN_SITE_ORIGIN}/admin/login`,
                icons: [
                    {
                        src: `${MAIN_SITE_ORIGIN}/admin-icon-192.png?v=${ADMIN_ICON_VERSION}`,
                        sizes: "192x192",
                    },
                    {
                        src: `${MAIN_SITE_ORIGIN}/admin-icon-512.png?v=${ADMIN_ICON_VERSION}`,
                        sizes: "512x512",
                    },
                ],
            },
        ],
        prefer_related_applications: false,
    };

    return NextResponse.json(manifest, {
        headers: {
            "Content-Type": "application/manifest+json",
            "Cache-Control": "public, max-age=0, must-revalidate",
            "Access-Control-Allow-Origin": "*",
        },
    });
}
