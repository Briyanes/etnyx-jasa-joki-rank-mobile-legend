import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

export const revalidate = 300; // Cache for 5 minutes

export async function GET(request: NextRequest) {
  try {
    const placement = request.nextUrl.searchParams.get("placement"); // "homepage" | "bio" | null
    const supabase = await createAdminClient();
    let query = supabase
      .from("promo_codes")
      .select("code, discount_type, discount_value, expires_at")
      .eq("is_active", true)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

    if (placement === "homepage") {
      query = query.eq("show_on_homepage", true);
    } else if (placement === "bio") {
      query = query.eq("show_on_bio", true);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ promos: data || [] });
  } catch {
    return NextResponse.json({ promos: [] });
  }
}
