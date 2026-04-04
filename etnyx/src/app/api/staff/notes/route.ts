import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { verifyStaff } from "@/lib/staff-auth";

// GET /api/staff/notes?orderId=xxx — Get notes for an order
export async function GET(request: NextRequest) {
  const { authenticated, user, error } = await verifyStaff();
  if (!authenticated || !user) return error;

  const orderId = request.nextUrl.searchParams.get("orderId");
  if (!orderId) {
    return NextResponse.json({ error: "Order ID wajib" }, { status: 400 });
  }

  const supabase = await createAdminClient();

  const { data, error: dbError } = await supabase
    .from("order_logs")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (dbError) {
    return NextResponse.json({ error: "Gagal memuat notes" }, { status: 500 });
  }

  return NextResponse.json({ notes: data || [] });
}

// POST /api/staff/notes — Add a note/comment to an order
export async function POST(request: NextRequest) {
  const { authenticated, user, error } = await verifyStaff();
  if (!authenticated || !user) return error;

  const { orderId, message } = await request.json();

  if (!orderId || !message?.trim()) {
    return NextResponse.json({ error: "Order ID dan pesan wajib" }, { status: 400 });
  }

  const supabase = await createAdminClient();

  // Workers can only add notes to their assigned orders
  if (user.role === "worker") {
    const { data: assignment } = await supabase
      .from("order_assignments")
      .select("id")
      .eq("order_id", orderId)
      .eq("assigned_to", user.id)
      .single();

    if (!assignment) {
      return NextResponse.json({ error: "Order tidak ditugaskan ke kamu" }, { status: 403 });
    }
  }

  const { data, error: insertError } = await supabase
    .from("order_logs")
    .insert({
      order_id: orderId,
      action: "note",
      new_value: message.trim(),
      notes: `${user.role}: ${user.name}`,
      created_by: user.name,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: "Gagal menambahkan catatan" }, { status: 500 });
  }

  return NextResponse.json({ success: true, note: data }, { status: 201 });
}
