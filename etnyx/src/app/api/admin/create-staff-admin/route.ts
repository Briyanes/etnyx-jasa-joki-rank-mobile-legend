import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createAdminClient } from "@/lib/supabase-server";
import { timingSafeEqual, createHash } from "crypto";

function safeCompare(a: string, b: string): boolean {
  try {
    const ha = createHash("sha256").update(a).digest();
    const hb = createHash("sha256").update(b).digest();
    return ha.length === hb.length && timingSafeEqual(ha, hb);
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  // Require CRON_SECRET to protect this endpoint
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "Endpoint disabled (CRON_SECRET not configured)" }, { status: 503 });
  }
  const authHeader = request.headers.get("authorization") || "";
  if (!safeCompare(authHeader, `Bearer ${cronSecret}`)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Password must come from env var — never hardcoded
  const password = process.env.ADMIN_INITIAL_PASSWORD;
  if (!password || password.length < 12) {
    return NextResponse.json({ error: "ADMIN_INITIAL_PASSWORD env var not set or too short (min 12 chars)" }, { status: 400 });
  }

  try {
    const hash = bcrypt.hashSync(password, 10);

    const supabase = await createAdminClient();

    // Check if admin exists
    const { data: existing } = await supabase
      .from("staff_users")
      .select("id")
      .eq("email", "admin@etnyx.com")
      .single();

    if (existing) {
      // Update existing admin password
      const { data, error } = await supabase
        .from("staff_users")
        .update({ password_hash: hash })
        .eq("email", "admin@etnyx.com")
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({
        success: true,
        message: "Admin password updated successfully",
        user: { email: data.email, name: data.name, role: data.role }
      });
    }

    // Create new admin user
    const { data, error } = await supabase
      .from("staff_users")
      .insert({
        email: "admin@etnyx.com",
        password_hash: hash,
        name: "Admin",
        role: "admin",
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "Admin staff user created successfully",
      user: { email: data.email, name: data.name, role: data.role }
    });
  } catch (error) {
    console.error("Create admin error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
