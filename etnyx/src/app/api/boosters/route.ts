import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

export async function GET() {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("boosters")
      .select("id, name, rank_specialization, specialization, is_available, total_orders, rating")
      .eq("is_available", true)
      .order("total_orders", { ascending: false });

    if (error) throw error;
    return NextResponse.json(
      { boosters: data },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
    );
  } catch {
    return NextResponse.json({ boosters: [] });
  }
}
