import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { verifyAdmin } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit-log";

export async function GET() {
  const auth = await verifyAdmin();
  if (!auth.authenticated) return auth.error!;
  try {
    const supabase = await createAdminClient();
    const { data, error } = await supabase
      .from("promo_codes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ promoCodes: data });
  } catch (error) {
    console.error("Get promo codes error:", error);
    return NextResponse.json({ promoCodes: [] });
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdmin();
  if (!auth.authenticated) return auth.error!;

  try {
    const supabase = await createAdminClient();
    const body = await request.json();

    // Validate required fields
    if (!body.code || typeof body.code !== "string" || body.code.trim().length < 2) {
      return NextResponse.json({ error: "Kode promo wajib minimal 2 karakter" }, { status: 400 });
    }
    if (!body.discount_type || !["percentage", "fixed"].includes(body.discount_type)) {
      return NextResponse.json({ error: "Tipe diskon harus 'percentage' atau 'fixed'" }, { status: 400 });
    }
    const discountValue = Number(body.discount_value);
    if (!Number.isFinite(discountValue) || discountValue <= 0) {
      return NextResponse.json({ error: "Nilai diskon harus lebih dari 0" }, { status: 400 });
    }
    if (body.discount_type === "percentage" && discountValue > 100) {
      return NextResponse.json({ error: "Diskon persen maksimal 100%" }, { status: 400 });
    }

    // Whitelist allowed fields
    const insertData: Record<string, unknown> = {
      code: body.code.toUpperCase().trim(),
      discount_type: body.discount_type,
      discount_value: discountValue,
      min_order: Number(body.min_order) || 0,
      max_uses: Number(body.max_uses) || null,
      is_active: body.is_active !== false,
      expires_at: body.expires_at ? new Date(body.expires_at).toISOString() : null,
    };

    const { data, error } = await supabase
      .from("promo_codes")
      .insert([insertData])
      .select()
      .single();

    if (error) throw error;
    logAdminAction({ admin_email: auth.user!.email, action: "create", resource_type: "promo_code", resource_id: data.id, details: `Created promo code: ${data.code}` });
    return NextResponse.json({ success: true, promoCode: data });
  } catch (error) {
    console.error("Create promo code error:", error);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = await verifyAdmin();
  if (!auth.authenticated) return auth.error!;

  try {
    const supabase = await createAdminClient();
    const body = await request.json();
    const { id, ...updates } = body;

    // Convert expires_at to proper format
    if (updates.expires_at) {
      updates.expires_at = new Date(updates.expires_at).toISOString();
    }
    if (updates.code) {
      updates.code = updates.code.toUpperCase();
    }

    const { data, error } = await supabase
      .from("promo_codes")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    logAdminAction({ admin_email: auth.user!.email, action: "update", resource_type: "promo_code", resource_id: id, details: `Updated promo code: ${data.code}` });
    return NextResponse.json({ success: true, promoCode: data });
  } catch (error) {
    console.error("Update promo code error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await verifyAdmin();
  if (!auth.authenticated) return auth.error!;

  try {
    const supabase = await createAdminClient();
    const { id } = await request.json();

    const { error } = await supabase
      .from("promo_codes")
      .delete()
      .eq("id", id);

    if (error) throw error;
    logAdminAction({ admin_email: auth.user!.email, action: "delete", resource_type: "promo_code", resource_id: id, details: `Deleted promo code` });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete promo code error:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
