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

type TokenRequestBody = {
  token?: string;
  deviceType?: string;
};

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: TokenRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { token, deviceType } = body;
  const userId = session.user.id;
  const email = session.user.email ?? null;

  if (!token || typeof token !== "string" || token.length < 10) {
    return NextResponse.json({ error: "Missing or invalid token" }, { status: 400 });
  }
  if (!userId || typeof userId !== "string") {
    return NextResponse.json({ error: "Session is missing user ID" }, { status: 500 });
  }

  // Detect device type from User-Agent if not provided
  const ua = req.headers.get("user-agent") ?? "";
  const detectedDeviceType =
    deviceType ??
    (ua.includes("Mobile") || ua.includes("Android") || ua.includes("iPhone")
      ? "mobile"
      : "web");

  const now = new Date().toISOString();
  const basePayload = {
    user_id: userId,
    fcm_token: token,
    email,
    device_type: detectedDeviceType,
    last_active_at: now,
    updated_at: now,
  };

  const { data: existingRow, error: lookupError } = await kpeAdmin
    .from("admin_fcm_tokens")
    .select("id")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lookupError) {
    console.error("[fcm-token] Error looking up existing token row:", lookupError);
    return NextResponse.json({ error: lookupError.message }, { status: 500 });
  }

  let persistedRowId = existingRow?.id ?? null;

  if (existingRow?.id) {
    const { error: updateError } = await kpeAdmin
      .from("admin_fcm_tokens")
      .update(basePayload)
      .eq("id", existingRow.id);

    if (updateError) {
      console.error("[fcm-token] Error updating existing token row:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
  } else {
    const { data: insertedRow, error: insertError } = await kpeAdmin
      .from("admin_fcm_tokens")
      .insert(basePayload)
      .select("id")
      .single();

    if (insertError) {
      const { data: tokenRow, error: tokenLookupError } = await kpeAdmin
        .from("admin_fcm_tokens")
        .select("id")
        .eq("fcm_token", token)
        .limit(1)
        .maybeSingle();

      if (tokenLookupError || !tokenRow?.id) {
        console.error("[fcm-token] Error saving FCM token:", insertError);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }

      const { error: tokenUpdateError } = await kpeAdmin
        .from("admin_fcm_tokens")
        .update(basePayload)
        .eq("id", tokenRow.id);

      if (tokenUpdateError) {
        console.error("[fcm-token] Error reconciling duplicate FCM token:", tokenUpdateError);
        return NextResponse.json({ error: tokenUpdateError.message }, { status: 500 });
      }

      persistedRowId = tokenRow.id;
    } else {
      persistedRowId = insertedRow.id;
    }
  }

  if (persistedRowId) {
    const { error: cleanupError } = await kpeAdmin
      .from("admin_fcm_tokens")
      .delete()
      .eq("user_id", userId)
      .neq("id", persistedRowId);

    if (cleanupError) {
      console.error("[fcm-token] Error cleaning duplicate token rows:", cleanupError);
    }
  }

  return NextResponse.json({ success: true });
}
