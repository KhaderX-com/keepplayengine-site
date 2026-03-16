import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KeepPlay Engine - Play-to-Earn Ecosystem",
  description: "A Play-to-Earn Ecosystem That Never Runs Dry. We build technology that engages and excites players — and an ecosystem that keeps the fun and the rewards flowing.",
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
    icon: [
      { url: "/keepplay-logo2.png?v=2", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/keepplay-logo2.png?v=2", sizes: "180x180", type: "image/png" },
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/keepplay-logo2.png?v=2" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Script src="/pwa-register.js" strategy="afterInteractive" />
        {children}
      </body>
    </html>
  );
}
