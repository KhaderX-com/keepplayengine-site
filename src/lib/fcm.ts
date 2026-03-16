/**
 * Firebase Cloud Messaging (FCM) — Server-side only
 *
 * Sends push notifications via the FCM v1 HTTP API using
 * Google service-account credentials (JWT → OAuth2 → FCM).
 *
 * ⚠️  Never import this file from client components.
 */

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function base64url(buf: Uint8Array): string {
    let s = "";
    for (const b of buf) s += String.fromCharCode(b);
    return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function importPrivateKey(pem: string): Promise<CryptoKey> {
    const stripped = pem
        .replace(/-----BEGIN PRIVATE KEY-----/, "")
        .replace(/-----END PRIVATE KEY-----/, "")
        .replace(/\s/g, "");
    const der = Uint8Array.from(atob(stripped), (c) => c.charCodeAt(0));
    return crypto.subtle.importKey(
        "pkcs8",
        der,
        { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
        false,
        ["sign"],
    );
}

async function createServiceAccountJWT(
    clientEmail: string,
    privateKey: CryptoKey,
): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: "RS256", typ: "JWT" };
    const payload = {
        iss: clientEmail,
        scope: "https://www.googleapis.com/auth/firebase.messaging",
        aud: "https://oauth2.googleapis.com/token",
        iat: now,
        exp: now + 3600,
    };

    const enc = new TextEncoder();
    const headerB64 = base64url(enc.encode(JSON.stringify(header)));
    const payloadB64 = base64url(enc.encode(JSON.stringify(payload)));
    const signingInput = `${headerB64}.${payloadB64}`;

    const signature = await crypto.subtle.sign(
        "RSASSA-PKCS1-v1_5",
        privateKey,
        enc.encode(signingInput),
    );

    return `${signingInput}.${base64url(new Uint8Array(signature))}`;
}

async function getAccessToken(jwt: string): Promise<string | null> {
    const resp = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    return data.access_token ?? null;
}

// ─────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────

export interface FcmResult {
    success: boolean;
    messageId?: string;
    error?: string;
}

/**
 * Replace `{key}` placeholders in a template string.
 */
export function renderTemplate(
    template: string,
    vars: Record<string, string>,
): string {
    let result = template;
    for (const [key, value] of Object.entries(vars)) {
        result = result.replaceAll(`{${key}}`, value);
    }
    return result;
}

/**
 * Send an FCM push notification. Returns result with success/failure info.
 * Reads FCM_PROJECT_ID, FCM_CLIENT_EMAIL, FCM_PRIVATE_KEY from env.
 */
export async function sendFcmPush(
    fcmToken: string,
    title: string,
    body: string,
    data?: Record<string, string>,
): Promise<FcmResult> {
    const projectId = process.env.FCM_PROJECT_ID;
    const clientEmail = process.env.FCM_CLIENT_EMAIL;
    const privateKeyPem = process.env.FCM_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKeyPem) {
        return { success: false, error: "FCM environment variables not configured" };
    }

    try {
        const privateKey = await importPrivateKey(privateKeyPem);
        const jwt = await createServiceAccountJWT(clientEmail, privateKey);
        const accessToken = await getAccessToken(jwt);

        if (!accessToken) {
            return { success: false, error: "Failed to obtain Google OAuth2 access token" };
        }

        const resp = await fetch(
            `https://fcm.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/messages:send`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    message: {
                        token: fcmToken,
                        notification: { title, body },
                        data: data ?? {},
                        android: {
                            priority: "high",
                            notification: {
                                channel_id: "keepplay_wallet",
                                sound: "default",
                            },
                        },
                        webpush: {
                            headers: {
                                Urgency: "high",
                            },
                            notification: {
                                icon: "/keepplay-logo2.png",
                                badge: "/keepplay-logo2.png",
                                requireInteraction: true,
                            },
                            fcm_options: {
                                link: data?.url ?? "/admin",
                            },
                        },
                        apns: {
                            headers: {
                                "apns-priority": "10",
                            },
                            payload: {
                                aps: {
                                    sound: "default",
                                    badge: 1,
                                },
                            },
                        },
                    },
                }),
            },
        );

        if (resp.ok) {
            const result = await resp.json();
            return { success: true, messageId: result.name ?? undefined };
        }

        const errText = await resp.text();
        return { success: false, error: errText };
    } catch (err) {
        return {
            success: false,
            error: err instanceof Error ? err.message : "Unknown FCM error",
        };
    }
}
