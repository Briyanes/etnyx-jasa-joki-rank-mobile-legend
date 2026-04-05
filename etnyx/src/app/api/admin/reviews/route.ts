"use server";

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { verifyAdmin } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit-log";

// GET: Fetch all reviews
export async function GET() {
  const auth = await verifyAdmin();
  if (!auth.authenticated) return auth.error!;

  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }

  return NextResponse.json({ reviews: data || [] });
}

// PATCH: Update review (visibility, report status, admin notes)
export async function PATCH(request: Request) {
  const auth = await verifyAdmin();
  if (!auth.authenticated) return auth.error!;

  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: "Review ID required" }, { status: 400 });
  }

  // Only allow specific fields to be updated
  const allowedFields = ["is_visible", "is_featured", "report_status", "admin_notes", "google_reviewed"];
  const updateData: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (key in updates) {
      updateData[key] = updates[key];
    }
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const supabase = await createAdminClient();
  const { error } = await supabase
    .from("reviews")
    .update(updateData)
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Failed to update review" }, { status: 500 });
  }

  logAdminAction({ admin_email: auth.user!.email, action: "update", resource_type: "testimonial", resource_id: id, details: `Updated review: ${Object.keys(updateData).join(", ")}` });

  return NextResponse.json({ success: true });
}

// DELETE: Delete review
export async function DELETE(request: Request) {
  const auth = await verifyAdmin();
  if (!auth.authenticated) return auth.error!;

  const { id } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "Review ID required" }, { status: 400 });
  }

  const supabase = await createAdminClient();
  const { error } = await supabase
    .from("reviews")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Failed to delete review" }, { status: 500 });
  }

  logAdminAction({ admin_email: auth.user!.email, action: "delete", resource_type: "testimonial", resource_id: id, details: "Deleted review" });

  return NextResponse.json({ success: true });
}
