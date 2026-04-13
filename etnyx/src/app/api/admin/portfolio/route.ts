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
      .from("portfolio")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ portfolios: data });
  } catch (error) {
    console.error("Get portfolio error:", error);
    return NextResponse.json({ portfolios: [] });
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdmin();
  if (!auth.authenticated) return auth.error!;

  try {
    const supabase = await createAdminClient();
    const body = await request.json();

    // Whitelist allowed fields
    const allowed = ["title", "description", "image_url", "before_rank", "after_rank", "hero", "is_visible", "category"];
    const safeData: Record<string, unknown> = {};
    for (const k of allowed) { if (k in body) safeData[k] = body[k]; }

    const { data, error } = await supabase
      .from("portfolio")
      .insert([safeData])
      .select()
      .single();

    if (error) throw error;
    logAdminAction({ admin_email: auth.user!.email, action: "create", resource_type: "portfolio", resource_id: data.id, details: `Created portfolio` });
    return NextResponse.json({ success: true, portfolio: data });
  } catch (error) {
    console.error("Create portfolio error:", error);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = await verifyAdmin();
  if (!auth.authenticated) return auth.error!;

  try {
    const supabase = await createAdminClient();
    const body = await request.json();
    const { id, ...rawUpdates } = body;

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    // Whitelist allowed fields
    const allowed = ["title", "description", "image_url", "before_rank", "after_rank", "hero", "is_visible", "category"];
    const updates: Record<string, unknown> = {};
    for (const k of allowed) { if (k in rawUpdates) updates[k] = rawUpdates[k]; }

    const { data, error } = await supabase
      .from("portfolio")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    logAdminAction({ admin_email: auth.user!.email, action: "update", resource_type: "portfolio", resource_id: id, details: `Updated portfolio` });
    return NextResponse.json({ success: true, portfolio: data });
  } catch (error) {
    console.error("Update portfolio error:", error);
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
      .from("portfolio")
      .delete()
      .eq("id", id);

    if (error) throw error;
    logAdminAction({ admin_email: auth.user!.email, action: "delete", resource_type: "portfolio", resource_id: id, details: `Deleted portfolio` });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete portfolio error:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
