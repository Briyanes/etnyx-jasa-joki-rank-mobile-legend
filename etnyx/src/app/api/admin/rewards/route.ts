import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { verifyAdmin } from "@/lib/admin-auth";
import { sanitizeInput } from "@/lib/validation";

// GET - List customer rewards (admin)
export async function GET(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin.authenticated) {
    return admin.error!;
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const tier = searchParams.get("tier") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const offset = (page - 1) * limit;

    const supabase = await createAdminClient();

    let query = supabase
      .from("customers")
      .select("id, name, email, whatsapp, reward_points, reward_tier, lifetime_points, total_orders, total_spent, created_at", { count: "exact" });

    if (search) {
      const sanitized = sanitizeInput(search);
      query = query.or(`name.ilike.%${sanitized}%,email.ilike.%${sanitized}%,whatsapp.ilike.%${sanitized}%`);
    }

    if (tier && ["bronze", "silver", "gold", "platinum"].includes(tier)) {
      query = query.eq("reward_tier", tier);
    }

    const { data, count, error } = await query
      .order("lifetime_points", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }

    return NextResponse.json({
      customers: data || [],
      pagination: { page, limit, total: count || 0 },
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST - Adjust customer points (admin)
export async function POST(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin.authenticated) {
    return admin.error!;
  }

  try {
    const { customerId, points, description } = await request.json();

    if (!customerId || typeof points !== "number" || points === 0) {
      return NextResponse.json({ error: "customerId dan points diperlukan" }, { status: 400 });
    }

    if (Math.abs(points) > 10000) {
      return NextResponse.json({ error: "Maksimum adjust 10,000 poin" }, { status: 400 });
    }

    const supabase = await createAdminClient();

    const { data, error } = await supabase.rpc("admin_adjust_reward_points", {
      p_customer_id: customerId,
      p_points: points,
      p_description: sanitizeInput(description || (points > 0 ? "Bonus poin dari admin" : "Pengurangan poin oleh admin")),
      p_admin_name: "Admin",
    });

    if (error) {
      return NextResponse.json({ error: "Gagal adjust poin" }, { status: 500 });
    }

    const result = data?.[0];
    return NextResponse.json({
      success: true,
      newBalance: result?.new_balance,
      newTier: result?.new_tier,
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
