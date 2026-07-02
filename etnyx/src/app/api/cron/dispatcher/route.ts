// Consolidated cron dispatcher for Vercel Free Tier (max 2 cron jobs)
// This route replaces 3 separate cron entries with a single unified dispatcher.
// Schedule: runs once daily at 09:00 UTC+7, then runs sub-tasks at appropriate times.

import { NextResponse } from "next/server";

// Graceful auth: works with or without CRON_SECRET
function verifyCronAuth(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;

  // If no secret is configured, allow access (graceful fallback for dev/staging)
  // Vercel cron jobs send this header automatically when configured in dashboard
  if (!cronSecret) {
    console.warn("[cron-dispatcher] CRON_SECRET not set — running without auth. Set it in production!");
    return true;
  }

  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: Request) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Record<string, unknown> = {};
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${request.headers.get("host") || "localhost:3000"}`;

  // Determine which tasks to run based on current hour (UTC+7)
  const now = new Date();
  const jakartaHour = (now.getUTCHours() + 7) % 24;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "cron-dispatcher/1.0",
  };

  // Always add CRON_SECRET if configured
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    headers["Authorization"] = `Bearer ${cronSecret}`;
  }

  // Task 1: Daily cron (payment reminders, auto-cancel, review requests)
  // Original schedule: 0 9 * * * (09:00 Jakarta time = 02:00 UTC)
  // Run this task during morning window (8-10 AM Jakarta)
  if (jakartaHour >= 8 && jakartaHour <= 10) {
    try {
      const res = await fetch(`${baseUrl}/api/cron`, { headers });
      results.dailyCron = { status: res.status, ok: res.ok, ...(await res.json().catch(() => ({}))) };
    } catch (error) {
      console.error("[cron-dispatcher] Daily cron error:", error);
      results.dailyCron = { error: String(error) };
    }
  }

  // Task 2: SLA check
  // Original schedule: 0 17 * * * (17:00 Jakarta time = 10:00 UTC)
  // Run this task during afternoon window (16-18 AM Jakarta)
  if (jakartaHour >= 16 && jakartaHour <= 18) {
    try {
      const res = await fetch(`${baseUrl}/api/admin/sla-check`, { headers });
      results.slaCheck = { status: res.status, ok: res.ok, ...(await res.json().catch(() => ({}))) };
    } catch (error) {
      console.error("[cron-dispatcher] SLA check error:", error);
      results.slaCheck = { error: String(error) };
    }
  }

  // Task 3: Meta Ads sync
  // Original schedule: 0 18 * * * (18:00 Jakarta time = 11:00 UTC)
  // Run this task during evening window (18-19 AM Jakarta)
  if (jakartaHour >= 18 && jakartaHour <= 19) {
    try {
      const res = await fetch(`${baseUrl}/api/cron/sync-meta-ads`, { headers });
      results.syncMetaAds = { status: res.status, ok: res.ok, ...(await res.json().catch(() => ({}))) };
    } catch (error) {
      console.error("[cron-dispatcher] Meta Ads sync error:", error);
      results.syncMetaAds = { error: String(error) };
    }
  }

  return NextResponse.json({
    ok: true,
    time: now.toISOString(),
    jakartaHour,
    results,
  });
}