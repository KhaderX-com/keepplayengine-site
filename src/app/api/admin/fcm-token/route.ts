import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth"; 
import { authOptions } from "@/lib/auth";
import { kpeAdmin } from "@/lib/supabase-kpe";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { token, userId, email } = await req.json();

  if (!token || !userId) {
    return NextResponse.json({ error: "Missing token or userId" }, { status: 400 });
  }

  // Insert or Update the token in KPE Database
  // Using `admin_fcm_tokens` table.
  
  const { error } = await kpeAdmin
    .from("admin_fcm_tokens")
    .upsert(
      { 
        user_id: userId, 
        fcm_token: token, 
        device_type: 'web',
        updated_at: new Date().toISOString()
      },
      { onConflict: 'fcm_token' } 
    );

  if (error) {
    console.error("Error saving FCM token:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
