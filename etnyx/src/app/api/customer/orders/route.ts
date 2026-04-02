import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET
);

export async function GET() {
  try {
    if (!process.env.JWT_SECRET) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("customer_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    const supabase = await createAdminClient();
    
    // Get orders for this customer (by email/whatsapp match or customer_id)
    const { data: customer } = await supabase
      .from("customers")
      .select("id, email, whatsapp")
      .eq("id", payload.id)
      .single();

    if (!customer) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    // Get orders linked to customer_id or matching whatsapp
    const { data: orders, error } = await supabase
      .from("orders")
      .select("*")
      .or(`customer_id.eq.${customer.id}${customer.whatsapp ? `,whatsapp.eq.${customer.whatsapp}` : ""}`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Orders fetch error:", error);
      return NextResponse.json({ orders: [] });
    }

    return NextResponse.json({ orders: orders || [] });
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}
