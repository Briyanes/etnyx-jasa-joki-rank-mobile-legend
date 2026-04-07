import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { verifyAdmin } from "@/lib/admin-auth";

export async function GET(request: Request) {
  const auth = await verifyAdmin();
  if (!auth.authenticated) return auth.error!;
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50")));
    const offset = (page - 1) * limit;

    const supabase = await createAdminClient();
    const { data, error, count } = await supabase
      .from("customers")
      .select("id, email, name, whatsapp, total_orders, total_spent, referral_code, reward_points, reward_tier, lifetime_points, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return NextResponse.json({ customers: data, total: count || 0, page, limit });
  } catch (error) {
    console.error("Get customers error:", error);
    return NextResponse.json({ customers: [] });
  }
}
