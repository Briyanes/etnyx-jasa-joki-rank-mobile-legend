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

export async function GET() {
  try {

    const cookieStore = await cookies();
    const token = cookieStore.get("customer_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, getJwtSecret());
    
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
    let ordersQuery = supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (customer.whatsapp) {
      const cleanWhatsapp = customer.whatsapp.replace(/[^0-9+]/g, "");
      ordersQuery = ordersQuery.or(`customer_id.eq.${customer.id},whatsapp.eq.${cleanWhatsapp}`);
    } else {
      ordersQuery = ordersQuery.eq("customer_id", customer.id);
    }

    const { data: orders, error } = await ordersQuery;

    if (error) {
      console.error("Orders fetch error:", error);
      return NextResponse.json({ orders: [] });
    }

    return NextResponse.json({ orders: orders || [] });
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}
