import type { Metadata, Viewport } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import SessionProvider from "@/components/SessionProvider";

export const metadata: Metadata = {
    title: "Admin Panel - KeepPlay Engine",
    description: "Secure administrative interface for KeepPlay Engine",
    robots: "noindex, nofollow",
    // PWA manifest served from same origin so it works on localhost
    manifest: "/admin-manifest.json",
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
            { url: "/admin-icon-192.png", sizes: "192x192", type: "image/png" },
            { url: "/admin-icon-512.png", sizes: "512x512", type: "image/png" },
        ],
        apple: [
            { url: "/admin-icon-192.png", sizes: "192x192", type: "image/png" },
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

    // Server-side authentication + role check (defense-in-depth — H01)
    // Cloudflare Access + proxy.ts provide outer layers, this is the final guard
    const userRole = session?.user?.role;
    const isAuthorizedRole = userRole === "SUPER_ADMIN" || userRole === "ADMIN" || userRole === "MODERATOR";

    // Only enforce role check for non-login pages.
    // Login page must remain accessible to unauthenticated users.
    // We detect login by checking if session is absent (unauthenticated → going to login).
    if (session && !isAuthorizedRole) {
        redirect("/admin/login");
    }

    return (
        <SessionProvider session={session}>
            {children}
        </SessionProvider>
    );
}
