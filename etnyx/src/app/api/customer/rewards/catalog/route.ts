import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

async function getCustomerId(): Promise<string | null> {
  try {
    if (!process.env.JWT_SECRET) return null;
    const cookieStore = await cookies();
    const token = cookieStore.get("customer_token")?.value;
    if (!token) return null;
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return (payload as { id: string }).id;
  } catch {
    return null;
  }
}

// GET - List catalog items (public) + customer redemption history (if logged in)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    const supabase = await createAdminClient();

    // Get active catalog items
    let query = supabase
      .from("reward_catalog")
      .select("id, name, description, category, points_cost, image_url, stock, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (category && ["skin", "starlight", "diamond", "discount", "merchandise"].includes(category)) {
      query = query.eq("category", category);
    }

    const { data: items } = await query;

    // If customer logged in, get their redemptions
    const customerId = await getCustomerId();
    let redemptions = null;
    if (customerId) {
      const { data } = await supabase
        .from("reward_redemptions")
        .select("id, catalog_item_id, points_spent, status, admin_notes, created_at, completed_at, reward_catalog(name, category, image_url)")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false })
        .limit(20);
      redemptions = data;
    }

    return NextResponse.json({ items: items || [], redemptions });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST - Redeem a catalog item
export async function POST(request: NextRequest) {
  try {
    const customerId = await getCustomerId();
    if (!customerId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { itemId, gameId } = await request.json();

    if (!itemId) {
      return NextResponse.json({ error: "itemId diperlukan" }, { status: 400 });
    }

    const supabase = await createAdminClient();

    const { data, error } = await supabase.rpc("redeem_catalog_item", {
      p_customer_id: customerId,
      p_item_id: itemId,
      p_game_id: gameId || null,
    });

    if (error) {
      return NextResponse.json({ error: "Gagal redeem" }, { status: 500 });
    }

    const result = data?.[0];
    if (!result?.success) {
      return NextResponse.json({ error: result?.message || "Gagal redeem" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      redemptionId: result.redemption_id,
      message: result.message,
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
