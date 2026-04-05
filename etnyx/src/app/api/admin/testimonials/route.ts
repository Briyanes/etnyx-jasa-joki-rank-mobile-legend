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
      .from("testimonials")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ testimonials: data });
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

    const { data, error } = await supabase
      .from("testimonials")
      .insert([body])
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
    const { id, ...updates } = body;

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
