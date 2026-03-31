import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

export async function GET() {
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
  try {
    const supabase = await createAdminClient();
    const body = await request.json();

    const { data, error } = await supabase
      .from("portfolio")
      .insert([body])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, portfolio: data });
  } catch (error) {
    console.error("Create portfolio error:", error);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createAdminClient();
    const body = await request.json();
    const { id, ...updates } = body;

    const { data, error } = await supabase
      .from("portfolio")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, portfolio: data });
  } catch (error) {
    console.error("Update portfolio error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createAdminClient();
    const { id } = await request.json();

    const { error } = await supabase
      .from("portfolio")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete portfolio error:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
