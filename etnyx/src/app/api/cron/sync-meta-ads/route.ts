import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

interface MetaInsightRow {
  date_start: string;
  campaign_name?: string;
  adset_name?: string;
  spend?: string;
  impressions?: string;
  clicks?: string;
}

function parseSpendNumber(raw: string | number | undefined | null): number {
  if (raw === undefined || raw === null || raw === "") return 0;
  const s = String(raw).replace(/\s/g, "").replace(/\./g, "").replace(/,/g, "");
  const n = parseFloat(s);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : 0;
}

// GET /api/cron/sync-meta-ads
// Called daily by Vercel Cron — syncs yesterday's Meta Ads data
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createAdminClient();

  // Load Meta Ads credentials from settings
  const { data: settingsData } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "integrations")
    .single();

  const token: string | undefined = settingsData?.value?.metaAdsAccessToken;
  const adAccountId: string | undefined = settingsData?.value?.metaAdsAdAccountId;

  if (!token || !adAccountId) {
    return NextResponse.json({
      skipped: true,
      reason: "Meta Ads token or Ad Account ID not configured in Settings > Integrations",
    });
  }

  // Sync yesterday in WIB (UTC+7)
  // Cron runs at 18:00 UTC = 01:00 WIB next day
  // so "now" in WIB is today; "yesterday" in WIB is the day we want
  const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
  const nowWib = new Date(Date.now() + WIB_OFFSET_MS);
  const yesterdayWib = new Date(nowWib);
  yesterdayWib.setDate(yesterdayWib.getDate() - 1);
  const dateStr = yesterdayWib.toISOString().split("T")[0];

  const accountId = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;
  const fields = "campaign_name,adset_name,spend,impressions,clicks";
  const timeRange = JSON.stringify({ since: dateStr, until: dateStr });
  const metaUrl = `https://graph.facebook.com/v21.0/${accountId}/insights?fields=${fields}&level=campaign&time_increment=1&time_range=${encodeURIComponent(timeRange)}&limit=500&access_token=${token}`;

  const metaRes = await fetch(metaUrl);
  const metaBody = await metaRes.json();

  if (!metaRes.ok || metaBody.error) {
    console.error("[cron/sync-meta-ads] Meta API error:", metaBody.error);
    return NextResponse.json(
      { error: metaBody.error?.message || "Meta API error", code: metaBody.error?.code },
      { status: 500 }
    );
  }

  const insights: MetaInsightRow[] = metaBody.data || [];

  // Handle pagination
  let nextUrl: string | undefined = metaBody.paging?.next;
  while (nextUrl) {
    const nextRes = await fetch(nextUrl);
    const nextBody = await nextRes.json();
    if (!nextRes.ok || !nextBody.data) break;
    insights.push(...(nextBody.data as MetaInsightRow[]));
    nextUrl = nextBody.paging?.next;
    if (insights.length > 2000) break;
  }

  if (insights.length === 0) {
    return NextResponse.json({ imported: 0, message: "No insights data for the period" });
  }

  const rows = insights.map((r) => ({
    date: r.date_start,
    platform: "meta",
    campaign_name: r.campaign_name?.slice(0, 255) || null,
    ad_set_name: r.adset_name?.slice(0, 255) || null,
    spend: parseSpendNumber(r.spend),
    impressions: r.impressions ? Math.round(Number(r.impressions)) : 0,
    clicks: r.clicks ? Math.round(Number(r.clicks)) : 0,
  }));

  const { data: inserted, error: insertErr } = await supabase
    .from("ad_spend")
    .upsert(rows, { onConflict: "date,platform,campaign_name", ignoreDuplicates: false })
    .select("id");

  if (insertErr) {
    // Fallback: insert one by one
    console.error("[cron/sync-meta-ads] Upsert error:", insertErr);
    let count = 0;
    for (const row of rows) {
      const { error } = await supabase.from("ad_spend").upsert(row, { onConflict: "date,platform,campaign_name" });
      if (!error) count++;
    }
    return NextResponse.json({ imported: count, period: dateStr });
  }

  console.log(`[cron/sync-meta-ads] Imported ${inserted?.length ?? rows.length} rows for ${dateStr}`);
  return NextResponse.json({
    imported: inserted?.length ?? rows.length,
    period: dateStr,
  });
}
