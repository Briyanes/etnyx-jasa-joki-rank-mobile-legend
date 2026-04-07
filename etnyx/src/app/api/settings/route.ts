import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

// Public CMS keys (safe for frontend consumption)
const PUBLIC_KEYS = [
  "hero",
  "promo_banner",
  "faq_items",
  "team_members",
  "section_visibility",
  "tracking_pixels",
  "social_links",
  "site_info",
  "pricing_catalog",
  "perstar_pricing",
  "gendong_pricing",
  "season_pricing",
];

// GET /api/settings?keys=hero,faq_items or GET all public
export async function GET(request: NextRequest) {
  const keysParam = request.nextUrl.searchParams.get("keys");
  const supabase = await createServerSupabase();

  let keys = PUBLIC_KEYS;
  if (keysParam) {
    keys = keysParam.split(",").filter((k) => PUBLIC_KEYS.includes(k));
  }

  const { data, error } = await supabase
    .from("settings")
    .select("key, value")
    .in("key", keys);

  if (error) {
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }

  const settings: Record<string, unknown> = {};
  for (const row of data || []) {
    settings[row.key] = row.value;
  }

  return NextResponse.json(settings, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
