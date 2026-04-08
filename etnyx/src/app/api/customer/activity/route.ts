import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

function getJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is required.");
  }
  return new TextEncoder().encode(process.env.JWT_SECRET);
}

// GET - Fetch customer's activity log
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("customer_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, getJwtSecret());
    const supabase = await createAdminClient();

    const { data: logs } = await supabase
      .from("customer_activity_log")
      .select("action, details, created_at")
      .eq("customer_id", payload.id)
      .order("created_at", { ascending: false })
      .limit(50);

    return NextResponse.json({ logs: logs || [] });
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}
