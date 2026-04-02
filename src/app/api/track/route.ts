import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("id");

  if (!orderId) {
    return NextResponse.json({ error: "Order ID diperlukan" }, { status: 400 });
  }

  // Sanitize input
  const sanitizedId = orderId.replace(/[^a-zA-Z0-9-]/g, "").toUpperCase();

  try {
    const supabase = await createAdminClient();
    const { data, error } = await supabase
      .from("orders")
      .select("order_id, username, current_rank, target_rank, package, status, progress, current_progress_rank, created_at, updated_at")
      .eq("order_id", sanitizedId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Gagal mengambil data order" }, { status: 500 });
  }
}
