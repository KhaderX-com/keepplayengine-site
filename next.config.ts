import type { NextConfig } from "next";

const enablePwaInDev = process.env.ENABLE_PWA_DEV === "true";

const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  register: true,
  skipWaiting: true,
  reloadOnOnline: true,
  // Avoid caching HTML during client-side navigation/start URL.
  // These are great for offline-first apps, but can easily cause stale chunk issues
  // after a deployment (especially for authenticated/admin pages).
  cacheStartUrl: false,
  cacheOnFrontendNav: false,
  // Service workers can interfere with HMR in dev, so we keep it off by default.
  // Set ENABLE_PWA_DEV=true in your .env to test PWA locally.
  disable: process.env.NODE_ENV === "development" && !enablePwaInDev,
  workboxOptions: {
    cleanupOutdatedCaches: true,
    clientsClaim: true,
    skipWaiting: true,
    runtimeCaching: [
      // Never cache navigations (HTML/RSC). This prevents "stale app shell" issues
      // after deploy which can manifest as missing images/assets or weird API loops.
      {
        urlPattern: ({ request }: { request: Request }) => request.mode === "navigate",
        handler: "NetworkOnly",
      },
      {
        urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "cloudinary-images",
          cacheableResponse: { statuses: [0, 200] },
          expiration: {
            maxEntries: 128,
            maxAgeSeconds: 30 * 24 * 60 * 60,
          },
        },
      },
      {
        urlPattern: /^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "google-fonts-webfonts",
          cacheableResponse: { statuses: [0, 200] },
          expiration: {
            maxEntries: 8,
            maxAgeSeconds: 365 * 24 * 60 * 60,
          },
        },
      },
      {
        urlPattern: /^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "google-fonts-stylesheets",
          cacheableResponse: { statuses: [0, 200] },
          expiration: {
            maxEntries: 8,
            maxAgeSeconds: 7 * 24 * 60 * 60,
          },
        },
      },
      {
        urlPattern: /\/_next\/image\?url=.+$/i,
        handler: "NetworkFirst",
        options: {
          cacheName: "next-image",
          cacheableResponse: { statuses: [0, 200] },
          expiration: {
            maxEntries: 128,
            maxAgeSeconds: 24 * 60 * 60,
          },
          networkTimeoutSeconds: 5,
        },
      },
      {
        urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "static-image-assets",
          cacheableResponse: { statuses: [0, 200] },
          expiration: {
            maxEntries: 128,
            maxAgeSeconds: 24 * 60 * 60,
          },
        },
      },
      {
        urlPattern: /\/api\/.*$/i,
        handler: "NetworkOnly",
        method: "GET",
      },
    ],
  },
});

const nextConfig: NextConfig = {
  /* config options here */
  // Add empty turbopack config to silence Next.js 16 warning
  // The webpack config from next-pwa still works fine
  turbopack: {},
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/favicon.ico',
          destination: '/keepplay-logo2.png',
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
  async headers() {
    // Prevent service worker files from being cached across deployments.
    // If an old SW stays cached/active, users can see missing chunks/assets.
    return [
      {
        source: "/admin-manifest.json",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET" },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
      {
        source: "/firebase-messaging-sw.js",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
    ];
  },
  images: {
    // Cloudinary-hosted SVG logos are used across the site. Next/Image blocks remote
    // SVGs by default unless explicitly enabled.
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/destej60y/**',
      },
    ],
  },
};

export default withPWA(nextConfig);
