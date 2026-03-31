import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

export async function GET() {
  try {
    const supabase = await createAdminClient();
    const { data, error } = await supabase
      .from("customers")
      .select("id, email, name, whatsapp, total_orders, total_spent, referral_code, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ customers: data });
  } catch (error) {
    console.error("Get customers error:", error);
    return NextResponse.json({ customers: [] });
  }
}
