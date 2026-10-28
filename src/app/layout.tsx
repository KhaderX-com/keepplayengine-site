import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import KlaroProvider from "@/components/KlaroProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://keepplayengine.com"),
  title: "KeepPlay Engine | Mobile Games Development & Publishing Studio",
  description:
    "Big ideas. Small screens. KeepPlay Engine is a mobile games development and publishing studio creating playful experiences for iOS and Android.",
  openGraph: {
    title: "KeepPlay Engine | Life needs a little more play.",
    description:
      "Mobile games development and publishing, with play at the heart of it all.",
    siteName: "KeepPlay Engine",
    type: "website",
    images: [
      {
        url: "/images/mobile-game-world-blue.webp",
        width: 1280,
        height: 1024,
        alt: "KeepPlay Engine mobile game concept world",
      },
    ],
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "KeepPlay Engine",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    // Keep the root site using a stable favicon.
    // Admin routes provide their own icons via src/app/admin/layout.tsx.
    icon: [{ url: "/KPE_icon_v3.png", type: "image/png", sizes: "512x512" }],
    shortcut: "/KPE_icon_v3.png",
    apple: [
      {
        url: "/icons/kpe-apple-touch.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#2D32FF",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <KlaroProvider />
        {children}
      </body>
    </html>
  );
}
