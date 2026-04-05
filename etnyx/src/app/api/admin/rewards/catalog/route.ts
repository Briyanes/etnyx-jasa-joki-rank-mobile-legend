import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { verifyAdmin } from "@/lib/admin-auth";
import { sanitizeInput } from "@/lib/validation";

// GET - List all catalog items + redemptions
export async function GET(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin.authenticated) return admin.error!;

  try {
    const { searchParams } = new URL(request.url);
    const view = searchParams.get("view"); // "catalog" or "redemptions"

    const supabase = await createAdminClient();

    if (view === "redemptions") {
      const status = searchParams.get("status");
      let query = supabase
        .from("reward_redemptions")
        .select("id, points_spent, status, admin_notes, game_id, created_at, completed_at, customers(name, email, whatsapp), reward_catalog(name, category)")
        .order("created_at", { ascending: false })
        .limit(100);

      if (status && ["pending", "processing", "completed", "rejected"].includes(status)) {
        query = query.eq("status", status);
      }

      const { data } = await query;
      return NextResponse.json({ redemptions: data || [] });
    }

    // Default: catalog items
    const { data } = await supabase
      .from("reward_catalog")
      .select("*")
      .order("sort_order", { ascending: true });

    return NextResponse.json({ items: data || [] });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST - Create catalog item
export async function POST(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin.authenticated) return admin.error!;

  try {
    const body = await request.json();
    const { name, description, category, pointsCost, imageUrl, stock } = body;

    if (!name || !pointsCost || !category) {
      return NextResponse.json({ error: "name, category, dan pointsCost diperlukan" }, { status: 400 });
    }

    if (!["skin", "starlight", "diamond", "discount", "merchandise"].includes(category)) {
      return NextResponse.json({ error: "Category tidak valid" }, { status: 400 });
    }

    const supabase = await createAdminClient();

    const { data, error } = await supabase
      .from("reward_catalog")
      .insert({
        name: sanitizeInput(name),
        description: description ? sanitizeInput(description) : null,
        category,
        points_cost: Math.max(1, Math.round(pointsCost)),
        image_url: imageUrl || null,
        stock: stock != null ? Math.max(0, Math.round(stock)) : null,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, item: data });
  } catch {
    return NextResponse.json({ error: "Gagal create item" }, { status: 500 });
  }
}

// PUT - Update catalog item or redemption status
export async function PUT(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin.authenticated) return admin.error!;

  try {
    const body = await request.json();
    const supabase = await createAdminClient();

    // Update redemption status
    if (body.redemptionId) {
      const { redemptionId, status, adminNotes } = body;
      if (!["pending", "processing", "completed", "rejected"].includes(status)) {
        return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
      }

      const updates: Record<string, unknown> = { status };
      if (adminNotes) updates.admin_notes = sanitizeInput(adminNotes);
      if (status === "completed") updates.completed_at = new Date().toISOString();
      if (status === "rejected") {
        // Refund points
        const { data: redemption } = await supabase
          .from("reward_redemptions")
          .select("customer_id, points_spent, status")
          .eq("id", redemptionId)
          .single();

        if (redemption && redemption.status !== "rejected") {
          await supabase.rpc("admin_adjust_reward_points", {
            p_customer_id: redemption.customer_id,
            p_points: redemption.points_spent,
            p_description: "Refund: reward ditolak",
            p_admin_name: "Admin",
          });
        }
      }

      const { error } = await supabase
        .from("reward_redemptions")
        .update(updates)
        .eq("id", redemptionId);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    // Update catalog item
    const { id, ...fields } = body;
    if (!id) return NextResponse.json({ error: "id diperlukan" }, { status: 400 });

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (fields.name) updates.name = sanitizeInput(fields.name);
    if (fields.description !== undefined) updates.description = fields.description ? sanitizeInput(fields.description) : null;
    if (fields.category) updates.category = fields.category;
    if (fields.pointsCost != null) updates.points_cost = Math.max(1, Math.round(fields.pointsCost));
    if (fields.imageUrl !== undefined) updates.image_url = fields.imageUrl || null;
    if (fields.stock !== undefined) updates.stock = fields.stock != null ? Math.max(0, Math.round(fields.stock)) : null;
    if (fields.isActive !== undefined) updates.is_active = !!fields.isActive;
    if (fields.sortOrder != null) updates.sort_order = fields.sortOrder;

    const { error } = await supabase
      .from("reward_catalog")
      .update(updates)
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Gagal update" }, { status: 500 });
  }
}

// DELETE - Delete catalog item
export async function DELETE(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin.authenticated) return admin.error!;

  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "id diperlukan" }, { status: 400 });

    const supabase = await createAdminClient();

    // Soft delete - just deactivate
    const { error } = await supabase
      .from("reward_catalog")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Gagal hapus" }, { status: 500 });
  }
}
