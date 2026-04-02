import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { verifyAdmin } from "@/lib/admin-auth";

export async function GET() {
  const auth = await verifyAdmin();
  if (!auth.authenticated) return auth.error!;
  try {
    const supabase = await createAdminClient();

    const { data, error } = await supabase
      .from("order_statistics")
      .select("*")
      .single();

    if (error) {
      console.error("Stats query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch statistics" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}
