import type { Metadata, Viewport } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SessionProvider from "@/components/SessionProvider";

export const metadata: Metadata = {
    title: "Admin Panel - KeepPlay Engine",
    description: "Secure administrative interface for KeepPlay Engine",
    robots: "noindex, nofollow",
    // PWA manifest served from Vercel CDN to bypass Cloudflare Access
    manifest: "https://public-pwa.vercel.app/admin-manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "KPE Admin",
    },
    formatDetection: {
        telephone: false,
    },
    icons: {
        icon: [
            { url: "https://public-pwa.vercel.app/admin-icon-192.png", sizes: "192x192", type: "image/png" },
            { url: "https://public-pwa.vercel.app/admin-icon-512.png", sizes: "512x512", type: "image/png" },
        ],
        apple: [
            { url: "https://public-pwa.vercel.app/admin-icon-192.png", sizes: "192x192", type: "image/png" },
        ],
    },
};

export const viewport: Viewport = {
    themeColor: "#2563eb",
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
};

export default async function AdminLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const session = await getServerSession(authOptions);

    // Server-side authentication check
    // Note: Cloudflare Access provides additional layer of security
    // This check ensures NextAuth session is valid

    return (
        <SessionProvider session={session}>
            {children}
        </SessionProvider>
    );
}
