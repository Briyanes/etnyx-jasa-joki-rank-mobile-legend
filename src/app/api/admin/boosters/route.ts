import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

export async function GET() {
  try {
    const supabase = await createAdminClient();
    const { data, error } = await supabase
      .from("boosters")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ boosters: data });
  } catch (error) {
    console.error("Get boosters error:", error);
    return NextResponse.json({ boosters: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createAdminClient();
    const body = await request.json();

    const { data, error } = await supabase
      .from("boosters")
      .insert([body])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, booster: data });
  } catch (error) {
    console.error("Create booster error:", error);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createAdminClient();
    const body = await request.json();
    const { id, ...updates } = body;

    const { data, error } = await supabase
      .from("boosters")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, booster: data });
  } catch (error) {
    console.error("Update booster error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createAdminClient();
    const { id } = await request.json();

    const { error } = await supabase
      .from("boosters")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete booster error:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
