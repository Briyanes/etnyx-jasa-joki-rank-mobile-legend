import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

// GET: Fetch ad spend entries + order attribution stats
export async function GET(request: NextRequest) {
  try {
    const supabase = await createAdminClient();
    const url = new URL(request.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");

    // Default: last 30 days
    const dateFrom = from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const dateTo = to || new Date().toISOString().split("T")[0];

    // Fetch ad spend entries
    const { data: spendData } = await supabase
      .from("ad_spend")
      .select("*")
      .gte("date", dateFrom)
      .lte("date", dateTo)
      .order("date", { ascending: false });

    // Fetch orders with attribution in date range (paid only)
    const { data: orders } = await supabase
      .from("orders")
      .select("order_id, total_price, base_price, utm_source, utm_medium, utm_campaign, fbclid, gclid, ttclid, payment_status, created_at, paid_at")
      .eq("payment_status", "paid")
      .gte("created_at", `${dateFrom}T00:00:00`)
      .lte("created_at", `${dateTo}T23:59:59`);

    // Aggregate revenue by source
    const sourceStats: Record<string, { orders: number; revenue: number; campaigns: Record<string, { orders: number; revenue: number }> }> = {};
    
    for (const order of orders || []) {
      let source = order.utm_source || "direct";
      if (!order.utm_source) {
        if (order.fbclid) source = "meta";
        else if (order.gclid) source = "google";
        else if (order.ttclid) source = "tiktok";
      }

      if (!sourceStats[source]) sourceStats[source] = { orders: 0, revenue: 0, campaigns: {} };
      sourceStats[source].orders += 1;
      sourceStats[source].revenue += order.total_price || 0;

      const campaign = order.utm_campaign || "(no campaign)";
      if (!sourceStats[source].campaigns[campaign]) sourceStats[source].campaigns[campaign] = { orders: 0, revenue: 0 };
      sourceStats[source].campaigns[campaign].orders += 1;
      sourceStats[source].campaigns[campaign].revenue += order.total_price || 0;
    }

    // Aggregate spend by platform
    const spendByPlatform: Record<string, number> = {};
    for (const s of spendData || []) {
      spendByPlatform[s.platform] = (spendByPlatform[s.platform] || 0) + (s.spend || 0);
    }

    return NextResponse.json({
      spend: spendData || [],
      spendByPlatform,
      sourceStats,
      totalOrders: orders?.length || 0,
      totalRevenue: (orders || []).reduce((sum, o) => sum + (o.total_price || 0), 0),
      totalSpend: Object.values(spendByPlatform).reduce((a, b) => a + b, 0),
      dateFrom,
      dateTo,
    });
  } catch (error) {
    console.error("Ad performance error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

// POST: Add ad spend entry
export async function POST(request: NextRequest) {
  try {
    const supabase = await createAdminClient();
    const body = await request.json();

    const { date, platform, campaign_name, ad_set_name, spend, impressions, clicks, notes } = body;

    if (!date || !platform || spend === undefined) {
      return NextResponse.json({ error: "date, platform, spend are required" }, { status: 400 });
    }

    if (!["meta", "google", "tiktok", "other"].includes(platform)) {
      return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("ad_spend")
      .insert({
        date,
        platform,
        campaign_name: campaign_name || null,
        ad_set_name: ad_set_name || null,
        spend: Math.round(Number(spend)),
        impressions: impressions ? Math.round(Number(impressions)) : 0,
        clicks: clicks ? Math.round(Number(clicks)) : 0,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Ad spend insert error:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}

// DELETE: Remove ad spend entry
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createAdminClient();
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    await supabase.from("ad_spend").delete().eq("id", id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
