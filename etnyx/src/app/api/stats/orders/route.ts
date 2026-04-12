import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

export const revalidate = 300; // Cache for 5 minutes

export async function GET() {
  try {
    const supabase = await createAdminClient();
    const { count, error } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true });

    if (error) throw error;

    return NextResponse.json(
      { count: count || 0 },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
    );
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
