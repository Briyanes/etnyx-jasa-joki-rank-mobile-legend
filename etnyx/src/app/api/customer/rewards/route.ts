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

// GET - Get customer rewards info + transaction history
export async function GET(request: NextRequest) {
  try {
    const customerId = await getCustomerId();
    if (!customerId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const offset = (page - 1) * limit;

    const supabase = await createAdminClient();

    // Get customer reward data
    const { data: customer } = await supabase
      .from("customers")
      .select("reward_points, reward_tier, lifetime_points")
      .eq("id", customerId)
      .single();

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Get transaction history
    const { data: transactions, count } = await supabase
      .from("reward_transactions")
      .select("id, type, points, balance_after, description, created_at", { count: "exact" })
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    return NextResponse.json({
      rewards: {
        points: customer.reward_points,
        tier: customer.reward_tier,
        lifetimePoints: customer.lifetime_points,
      },
      transactions: transactions || [],
      pagination: {
        page,
        limit,
        total: count || 0,
      },
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST - Redeem points
export async function POST(request: NextRequest) {
  try {
    const customerId = await getCustomerId();
    if (!customerId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { points } = await request.json();

    if (!points || typeof points !== "number" || points < 100) {
      return NextResponse.json({ error: "Minimum redeem 100 poin" }, { status: 400 });
    }

    if (points > 10000) {
      return NextResponse.json({ error: "Maksimum redeem 10,000 poin per transaksi" }, { status: 400 });
    }

    const supabase = await createAdminClient();

    const { data, error } = await supabase.rpc("redeem_reward_points", {
      p_customer_id: customerId,
      p_points: points,
    });

    if (error) {
      return NextResponse.json({ error: "Gagal redeem poin" }, { status: 500 });
    }

    const result = data?.[0];
    if (!result?.success) {
      return NextResponse.json({ error: result?.message || "Gagal redeem" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      discount: result.discount_amount,
      remainingPoints: result.remaining_points,
      message: result.message,
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
