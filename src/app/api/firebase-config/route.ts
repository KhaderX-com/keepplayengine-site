/**
 * GET /api/firebase-config
 *
 * Returns public Firebase configuration for use by the service worker.
 * All values are already public (NEXT_PUBLIC_*) — no secrets exposed.
 *
 * This endpoint is needed because service workers cannot access
 * process.env at runtime (static files in /public), so we serve
 * the config dynamically from the Next.js server.
 *
 * Security: Only NEXT_PUBLIC_* vars are returned. No auth required
 * (Firebase client config is already published in the browser bundle).
 */

import { NextResponse } from "next/server";

export async function GET() {
    const config = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? null,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? null,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? null,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? null,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? null,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? null,
        measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? null,
    };

    // Validate that critical fields are present
    if (!config.apiKey || !config.projectId || !config.messagingSenderId) {
        return NextResponse.json(
            { error: "Firebase configuration is incomplete" },
            { status: 503 }
        );
    }

    return NextResponse.json(config, {
        headers: {
            // Cache for 1 hour on CDN, revalidate in background
            "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
            "Content-Type": "application/json",
        },
    });
}
