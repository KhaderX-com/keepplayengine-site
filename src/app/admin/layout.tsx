import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/app/globals.css";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SessionProvider from "@/components/SessionProvider";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Admin Panel - KeepPlay Engine",
    description: "Secure administrative interface for KeepPlay Engine",
    robots: "noindex, nofollow",
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "KPE Admin",
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

    return (
        <html lang="en">
            <head>
                <link rel="icon" href="/icon-192.png" />
                <link rel="apple-touch-icon" href="/icon-192.png" />
            </head>
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased`}
            >
                <SessionProvider session={session}>
                    {children}
                </SessionProvider>
            </body>
        </html>
    );
}
