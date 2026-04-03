import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { verifyAdmin } from "@/lib/admin-auth";

// Allowed CMS setting keys (whitelist for security)
const ALLOWED_KEYS = [
  "hero",
  "promo_banner",
  "faq_items",
  "team_members",
  "section_visibility",
  "tracking_pixels",
  "social_links",
  "site_info",
  "pricing",
  "pricing_catalog",
  "express_multiplier",
  "whatsapp_number",
  "site_name",
  "integrations",
  "perstar_pricing",
  "gendong_pricing",
];

// GET /api/admin/settings?key=hero or GET all
export async function GET(request: NextRequest) {
  const { authenticated, error: authError } = await verifyAdmin();
  if (!authenticated) return authError;

  const key = request.nextUrl.searchParams.get("key");
  const supabase = await createAdminClient();

  if (key) {
    if (!ALLOWED_KEYS.includes(key)) {
      return NextResponse.json({ error: "Invalid key" }, { status: 400 });
    }
    const { data, error } = await supabase
      .from("settings")
      .select("*")
      .eq("key", key)
      .single();

    if (error) {
      return NextResponse.json({ key, value: null }, { status: 200 });
    }
    return NextResponse.json({ key: data.key, value: data.value });
  }

  // Get all CMS settings
  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .in("key", ALLOWED_KEYS)
    .order("key");

  if (error) {
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }

  const settings: Record<string, unknown> = {};
  for (const row of data || []) {
    settings[row.key] = row.value;
  }

  return NextResponse.json({ settings });
}

// PUT /api/admin/settings - Upsert a setting
export async function PUT(request: NextRequest) {
  const { authenticated, error: authError } = await verifyAdmin();
  if (!authenticated) return authError;

  const body = await request.json();
  const { key, value } = body;

  if (!key || value === undefined) {
    return NextResponse.json({ error: "key and value are required" }, { status: 400 });
  }

  if (!ALLOWED_KEYS.includes(key)) {
    return NextResponse.json({ error: "Invalid key" }, { status: 400 });
  }

  const supabase = await createAdminClient();
  const { error } = await supabase
    .from("settings")
    .upsert(
      { key, value, updated_at: new Date().toISOString() },
      { onConflict: "key" }
    );

  if (error) {
    console.error("Settings upsert error:", error);
    return NextResponse.json({ error: "Failed to save setting" }, { status: 500 });
  }

  return NextResponse.json({ success: true, key });
}
