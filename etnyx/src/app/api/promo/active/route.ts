import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

export const revalidate = 300; // Cache for 5 minutes

export async function GET() {
  try {
    const supabase = await createAdminClient();
    const { data, error } = await supabase
      .from("promo_codes")
      .select("code, discount_type, discount_value, expires_at")
      .eq("is_active", true)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ promos: data || [] });
  } catch {
    return NextResponse.json({ promos: [] });
  }
}