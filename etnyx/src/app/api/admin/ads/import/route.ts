import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { verifyAdmin } from "@/lib/admin-auth";

// ── Meta Marketing API Insights Sync ─────────────────────────
// POST /api/admin/ads/import
// Body:
//   { type: "meta_api", adAccountId: "act_XXXXX", dateFrom: "YYYY-MM-DD", dateTo: "YYYY-MM-DD", accessToken?: string }
//   { type: "csv", rows: CsvRow[] }

interface CsvRow {
  date: string;
  platform: string;
  campaign_name?: string | null;
  ad_set_name?: string | null;
  spend: number;
  impressions?: number;
  clicks?: number;
}

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

export async function POST(request: NextRequest) {
  const auth = await verifyAdmin();
  if (!auth.authenticated) return auth.error!;

  try {
    const body = await request.json();
    const { type } = body;

    if (!type || !["csv", "meta_api"].includes(type)) {
      return NextResponse.json({ error: "type must be 'csv' or 'meta_api'" }, { status: 400 });
    }

    const supabase = await createAdminClient();

    // ── CSV Bulk Import ──────────────────────────────────────
    if (type === "csv") {
      const rows: CsvRow[] = body.rows;
      if (!Array.isArray(rows) || rows.length === 0) {
        return NextResponse.json({ error: "rows array is required" }, { status: 400 });
      }

      // Validate & sanitize
      const valid: CsvRow[] = [];
      const errors: string[] = [];
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        if (!r.date || !/^\d{4}-\d{2}-\d{2}$/.test(r.date)) {
          errors.push(`Row ${i + 1}: tanggal tidak valid (${r.date})`);
          continue;
        }
        if (!["meta", "google", "tiktok", "other"].includes(r.platform)) {
          errors.push(`Row ${i + 1}: platform tidak valid (${r.platform})`);
          continue;
        }
        const spend = parseSpendNumber(r.spend);
        if (spend < 0) {
          errors.push(`Row ${i + 1}: spend tidak valid`);
          continue;
        }
        valid.push({
          date: r.date,
          platform: r.platform,
          campaign_name: r.campaign_name?.slice(0, 255) || null,
          ad_set_name: r.ad_set_name?.slice(0, 255) || null,
          spend,
          impressions: r.impressions ? Math.round(Number(r.impressions)) : 0,
          clicks: r.clicks ? Math.round(Number(r.clicks)) : 0,
        });
      }

      if (valid.length === 0) {
        return NextResponse.json({ error: "Tidak ada baris valid", details: errors }, { status: 400 });
      }

      // Upsert by date+platform+campaign_name to avoid duplicates
      const { data: inserted, error: insertErr } = await supabase
        .from("ad_spend")
        .upsert(valid, { onConflict: "date,platform,campaign_name", ignoreDuplicates: false })
        .select("id");

      if (insertErr) {
        console.error("CSV import error:", insertErr);
        // Fallback: insert one by one, skip duplicates
        let insertedCount = 0;
        for (const row of valid) {
          const { error: singleErr } = await supabase.from("ad_spend").insert(row);
          if (!singleErr) insertedCount++;
        }
        return NextResponse.json({ imported: insertedCount, skipped: valid.length - insertedCount, errors });
      }

      return NextResponse.json({
        imported: inserted?.length ?? valid.length,
        skipped: rows.length - valid.length,
        errors,
      });
    }

    // ── Meta Marketing API Sync ──────────────────────────────
    if (type === "meta_api") {
      const { adAccountId, dateFrom, dateTo, accessToken: bodyToken } = body;

      if (!adAccountId) {
        return NextResponse.json({ error: "adAccountId diperlukan (contoh: act_123456789)" }, { status: 400 });
      }
      if (!dateFrom || !dateTo) {
        return NextResponse.json({ error: "dateFrom dan dateTo diperlukan" }, { status: 400 });
      }

      // Get access token — use provided, or fall back to stored Meta WA token
      let token = bodyToken;
      if (!token) {
        const { data: settings } = await supabase
          .from("settings")
          .select("value")
          .eq("key", "integrations")
          .single();
        token = settings?.value?.metaWaAccessToken;
      }

      if (!token) {
        return NextResponse.json({ error: "Access token tidak ditemukan. Isi di Settings > Integrations atau kirim di body." }, { status: 400 });
      }

      // Normalize ad account ID — ensure it starts with "act_"
      const accountId = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;

      // Call Meta Marketing API Insights
      const fields = "campaign_name,adset_name,spend,impressions,clicks";
      const timeRange = JSON.stringify({ since: dateFrom, until: dateTo });
      const metaUrl = `https://graph.facebook.com/v21.0/${accountId}/insights?fields=${fields}&time_increment=1&time_range=${encodeURIComponent(timeRange)}&limit=500&access_token=${token}`;

      const metaRes = await fetch(metaUrl);
      const metaBody = await metaRes.json();

      if (!metaRes.ok || metaBody.error) {
        const errMsg = metaBody.error?.message || "Meta API error";
        const errCode = metaBody.error?.code;
        console.error("Meta API error:", metaBody.error);

        // Friendly error messages
        if (errCode === 190) return NextResponse.json({ error: "Access token tidak valid atau sudah expired. Generate token baru." }, { status: 401 });
        if (errCode === 200 || errCode === 273) return NextResponse.json({ error: "Token tidak punya izin ads_read. Tambahkan permission di Meta Business Settings > System Users." }, { status: 403 });
        if (errCode === 100) return NextResponse.json({ error: "Ad Account ID tidak valid. Pastikan format: act_XXXXXXXXX" }, { status: 400 });
        return NextResponse.json({ error: errMsg }, { status: 400 });
      }

      const insights: MetaInsightRow[] = metaBody.data || [];

      // Handle pagination if there are more pages
      let nextUrl = metaBody.paging?.next;
      while (nextUrl) {
        const nextRes = await fetch(nextUrl);
        const nextBody = await nextRes.json();
        if (!nextRes.ok || !nextBody.data) break;
        insights.push(...(nextBody.data as MetaInsightRow[]));
        nextUrl = nextBody.paging?.next;
        if (insights.length > 5000) break; // safety limit
      }

      if (insights.length === 0) {
        return NextResponse.json({ imported: 0, skipped: 0, message: "Tidak ada data insights di periode ini." });
      }

      // Map to ad_spend rows
      const rows = insights.map((r) => ({
        date: r.date_start,
        platform: "meta",
        campaign_name: r.campaign_name?.slice(0, 255) || null,
        ad_set_name: r.adset_name?.slice(0, 255) || null,
        spend: parseSpendNumber(r.spend),
        impressions: r.impressions ? Math.round(Number(r.impressions)) : 0,
        clicks: r.clicks ? Math.round(Number(r.clicks)) : 0,
      }));

      // Upsert to avoid duplicates
      const { data: inserted, error: insertErr } = await supabase
        .from("ad_spend")
        .upsert(rows, { onConflict: "date,platform,campaign_name", ignoreDuplicates: false })
        .select("id");

      if (insertErr) {
        // Fallback: insert one by one
        console.error("Meta API upsert error:", insertErr);
        let insertedCount = 0;
        for (const row of rows) {
          const { error: singleErr } = await supabase.from("ad_spend").insert(row);
          if (!singleErr) insertedCount++;
        }
        return NextResponse.json({ imported: insertedCount, skipped: rows.length - insertedCount, total: insights.length });
      }

      return NextResponse.json({ imported: inserted?.length ?? rows.length, total: insights.length });
    }

    return NextResponse.json({ error: "Unknown type" }, { status: 400 });
  } catch (error) {
    console.error("Ads import error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
