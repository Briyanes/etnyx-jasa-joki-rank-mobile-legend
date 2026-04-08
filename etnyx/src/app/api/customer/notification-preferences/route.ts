import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

function getJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is required.");
  }
  return new TextEncoder().encode(process.env.JWT_SECRET);
}

async function getCustomerId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("customer_token")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return payload.id as string;
  } catch {
    return null;
  }
}

// GET - Fetch notification preferences
export async function GET() {
  try {
    const customerId = await getCustomerId();
    if (!customerId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const supabase = await createAdminClient();
    const { data } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("customer_id", customerId)
      .single();

    // Return defaults if no preferences set yet
    const prefs = data || {
      email_order_updates: true,
      email_promotions: true,
      whatsapp_order_updates: true,
      whatsapp_promotions: false,
      push_order_updates: true,
      push_promotions: false,
    };

    return NextResponse.json({ preferences: prefs });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PUT - Update notification preferences
export async function PUT(request: NextRequest) {
  try {
    const customerId = await getCustomerId();
    if (!customerId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const allowedFields = [
      "email_order_updates", "email_promotions",
      "whatsapp_order_updates", "whatsapp_promotions",
      "push_order_updates", "push_promotions",
    ];

    const updates: Record<string, boolean> = {};
    for (const field of allowedFields) {
      if (typeof body[field] === "boolean") {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields" }, { status: 400 });
    }

    const supabase = await createAdminClient();

    // Upsert preferences
    const { error } = await supabase
      .from("notification_preferences")
      .upsert(
        { customer_id: customerId, ...updates, updated_at: new Date().toISOString() },
        { onConflict: "customer_id" }
      );

    if (error) {
      console.error("Notification prefs update error:", error);
      return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
