/**
 * POST /api/admin/fcm-token
 *
 * Registers or refreshes the admin's FCM push notification token.
 * Called automatically on every page load via useFcmToken() hook,
 * so the token stays fresh even when the admin uses multiple devices
 * or reinstalls the PWA.
 *
 * Upserts on user_id — each admin has exactly ONE active token
 * (their most recently used device/browser). This guarantees the
 * notify-withdrawal-request webhook always has a valid token to send to.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { kpeAdmin } from "@/lib/supabase-kpe";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { token?: string; userId?: string; email?: string; deviceType?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { token, userId, email, deviceType } = body;

  if (!token || typeof token !== "string" || token.length < 10) {
    return NextResponse.json({ error: "Missing or invalid token" }, { status: 400 });
  }
  if (!userId || typeof userId !== "string") {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  // Detect device type from User-Agent if not provided
  const ua = req.headers.get("user-agent") ?? "";
  const detectedDeviceType =
    deviceType ??
    (ua.includes("Mobile") || ua.includes("Android") || ua.includes("iPhone")
      ? "mobile"
      : "web");

  const now = new Date().toISOString();

  // Upsert on user_id — replaces old token when admin switches devices.
  // Also upsert on fcm_token (unique) to avoid duplicate rows if the same
  // device registers from a different session.
  const { error } = await kpeAdmin
    .from("admin_fcm_tokens")
    .upsert(
      {
        user_id: userId,
        fcm_token: token,
        email: email ?? session.user.email ?? null,
        device_type: detectedDeviceType,
        last_active_at: now,
        updated_at: now,
      },
      { onConflict: "user_id" },
    );

  if (error) {
    // If user_id upsert fails (e.g., race condition with old token value),
    // try upserting on fcm_token as fallback
    const { error: fallbackError } = await kpeAdmin
      .from("admin_fcm_tokens")
      .upsert(
        {
          user_id: userId,
          fcm_token: token,
          email: email ?? session.user.email ?? null,
          device_type: detectedDeviceType,
          last_active_at: now,
          updated_at: now,
        },
        { onConflict: "fcm_token" },
      );

    if (fallbackError) {
      console.error("[fcm-token] Error saving FCM token:", fallbackError);
      return NextResponse.json({ error: fallbackError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
