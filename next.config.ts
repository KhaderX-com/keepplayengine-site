import type { NextConfig } from "next";

const enablePwaInDev = process.env.ENABLE_PWA_DEV === "true";

const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  register: true,
  skipWaiting: true,
  // Service workers can interfere with HMR in dev, so we keep it off by default.
  // Set ENABLE_PWA_DEV=true in your .env to test PWA locally.
  disable: process.env.NODE_ENV === "development" && !enablePwaInDev,
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "cloudinary-images",
        cacheableResponse: {
          statuses: [0, 200],
        },
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    },
    {
      urlPattern: /^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "google-fonts-webfonts",
        cacheableResponse: {
          statuses: [0, 200],
        },
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 365 days
        },
      },
    },
    {
      urlPattern: /^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "google-fonts-stylesheets",
        cacheableResponse: {
          statuses: [0, 200],
        },
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        },
      },
    },
    {
      urlPattern: /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "static-font-assets",
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        },
      },
    },
    {
      urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "static-image-assets",
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
      },
    },
    {
      urlPattern: /\/_next\/image\?url=.+$/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "next-image",
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
      },
    },
    {
      urlPattern: /\.(?:mp3|wav|ogg)$/i,
      handler: "CacheFirst",
      options: {
        rangeRequests: true,
        cacheName: "static-audio-assets",
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
      },
    },
    {
      urlPattern: /\.(?:mp4)$/i,
      handler: "CacheFirst",
      options: {
        rangeRequests: true,
        cacheName: "static-video-assets",
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
      },
    },
    {
      urlPattern: /\.(?:js)$/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "static-js-assets",
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
      },
    },
    {
      urlPattern: /\.(?:css|less)$/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "static-style-assets",
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
      },
    },
    {
      urlPattern: /\/_next\/data\/.+\/.+\.json$/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "next-data",
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
      },
    },
    {
      urlPattern: /\/manifest\.json$/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "manifest",
        expiration: {
          maxEntries: 1,
          maxAgeSeconds: 60 * 60, // 1 hour
        },
        networkTimeoutSeconds: 5,
      },
    },
    {
      urlPattern: /\/api\/.*$/i,
      // Do not cache API responses (admin data changes frequently and is rate limited).
      // Respect upstream `Cache-Control: no-store`.
      handler: "NetworkOnly",
      method: "GET",
      options: {
        cacheName: "apis",
      },
    },
    {
      // Cache only non-admin navigations. Caching HTML for admin routes can cause
      // stale build mismatches after deploy (cached HTML references old chunk URLs).
      urlPattern: ({ request, url }: { request: Request; url: URL }) =>
        request.mode === "navigate" && !url.pathname.startsWith("/admin"),
      handler: "NetworkFirst",
      options: {
        cacheName: "pages",
        cacheableResponse: {
          statuses: [0, 200],
        },
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
        networkTimeoutSeconds: 3,
      },
    },
  ],
});

const nextConfig: NextConfig = {
  /* config options here */
  // Add empty turbopack config to silence Next.js 16 warning
  // The webpack config from next-pwa still works fine
  turbopack: {},
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
