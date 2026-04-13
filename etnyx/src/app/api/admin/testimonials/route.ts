import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { verifyAdmin } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit-log";

export async function GET(request: NextRequest) {
  const auth = await verifyAdmin();
  if (!auth.authenticated) return auth.error!;
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50")));
    const offset = (page - 1) * limit;

    const supabase = await createAdminClient();
    const { data, error, count } = await supabase
      .from("testimonials")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return NextResponse.json({ testimonials: data, total: count || 0, page, limit });
  } catch (error) {
    console.error("Get testimonials error:", error);
    return NextResponse.json({ testimonials: [] });
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdmin();
  if (!auth.authenticated) return auth.error!;

  try {
    const supabase = await createAdminClient();
    const body = await request.json();

    // Whitelist allowed fields
    const allowed = ["name", "text", "rating", "avatar_url", "is_visible", "rank", "package"];
    const safeData: Record<string, unknown> = {};
    for (const k of allowed) { if (k in body) safeData[k] = body[k]; }

    const { data, error } = await supabase
      .from("testimonials")
      .insert([safeData])
      .select()
      .single();

    if (error) throw error;
    logAdminAction({ admin_email: auth.user!.email, action: "create", resource_type: "testimonial", resource_id: data.id, details: `Created testimonial by ${data.name}` });
    return NextResponse.json({ success: true, testimonial: data });
  } catch (error) {
    console.error("Create testimonial error:", error);
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
    const allowed = ["name", "text", "rating", "avatar_url", "is_visible", "rank", "package"];
    const updates: Record<string, unknown> = {};
    for (const k of allowed) { if (k in rawUpdates) updates[k] = rawUpdates[k]; }

    const { data, error } = await supabase
      .from("testimonials")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    logAdminAction({ admin_email: auth.user!.email, action: "update", resource_type: "testimonial", resource_id: id, details: `Updated testimonial` });
    return NextResponse.json({ success: true, testimonial: data });
  } catch (error) {
    console.error("Update testimonial error:", error);
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
      .from("testimonials")
      .delete()
      .eq("id", id);

    if (error) throw error;
    logAdminAction({ admin_email: auth.user!.email, action: "delete", resource_type: "testimonial", resource_id: id, details: `Deleted testimonial` });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete testimonial error:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
