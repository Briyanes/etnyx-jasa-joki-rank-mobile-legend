import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

export async function GET() {
  try {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from("portfolio")
      .select("*")
      .eq("is_visible", true)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch {
    return NextResponse.json([]);
  }
}
