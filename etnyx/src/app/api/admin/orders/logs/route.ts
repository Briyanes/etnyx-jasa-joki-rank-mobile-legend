import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { verifyAdmin } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  const auth = await verifyAdmin();
  if (!auth.authenticated) return auth.error!;

  const supabase = await createAdminClient();
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { data, error } = await supabase
    .from("order_logs")
    .select("action, old_value, new_value, notes, created_by, created_at")
    .eq("order_id", id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ logs: data || [] });
}
