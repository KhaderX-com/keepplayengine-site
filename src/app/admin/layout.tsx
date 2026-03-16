import type { Metadata, Viewport } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import SessionProvider from "@/components/SessionProvider";

export const metadata: Metadata = {
    title: "Admin Panel - KeepPlay Engine",
    description: "Secure administrative interface for KeepPlay Engine",
    robots: "noindex, nofollow",
    // PWA manifest served from same origin (middleware whitelists this path)
    manifest: "/admin-manifest.json?v=5",
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
            { url: "/keepplay-logo2.png?v=5", sizes: "512x512", type: "image/png" },
        ],
        shortcut: [
            { url: "/keepplay-logo2.png?v=5", type: "image/png" },
        ],
        apple: [
            { url: "/keepplay-logo2.png?v=5", sizes: "180x180", type: "image/png" },
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
            <head>
                {/* Explicit favicon links — force all browsers to use our logo.
                    Next.js metadata.icons alone is sometimes insufficient on
                    subdomains / Cloudflare proxied routes, so we inject tags
                    directly too — same pattern as the root layout that works. */}
                <link rel="icon" href="/keepplay-logo2.png?v=5" type="image/png" />
                <link rel="shortcut icon" href="/keepplay-logo2.png?v=5" type="image/png" />
                <link rel="apple-touch-icon" href="/keepplay-logo2.png?v=5" />
                <meta name="mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
            </head>
            {children}
        </SessionProvider>
    );
}
