import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

interface ServiceStatus {
  status: "ok" | "error";
  latency_ms?: number;
  error?: string;
}

async function checkSupabase(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    const supabase = await createAdminClient();
    const { error } = await supabase.from("settings").select("key").limit(1);
    if (error) throw error;
    return { status: "ok", latency_ms: Date.now() - start };
  } catch (e) {
    console.error("Health check - Supabase error:", e);
    return { status: "error", latency_ms: Date.now() - start, error: "Database connection failed" };
  }
}

async function checkIpaymu(): Promise<ServiceStatus> {
  const apiKey = process.env.IPAYMU_API_KEY;
  const va = process.env.IPAYMU_VA;
  if (!apiKey || !va) return { status: "error", error: "Not configured" };

  const start = Date.now();
  try {
    const isProduction = process.env.IPAYMU_IS_PRODUCTION === "true";
    const baseUrl = isProduction
      ? "https://my.ipaymu.com"
      : "https://sandbox.ipaymu.com";

    const res = await fetch(`${baseUrl}/api/v2/balance`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      signal: AbortSignal.timeout(5000),
    });
    return { status: res.ok ? "ok" : "error", latency_ms: Date.now() - start };
  } catch (e) {
    console.error("Health check - iPaymu error:", e);
    return { status: "error", latency_ms: Date.now() - start, error: "Payment service unreachable" };
  }
}

async function checkNotifications(): Promise<Record<string, ServiceStatus>> {
  const results: Record<string, ServiceStatus> = {};

  // Check Telegram
  try {
    const supabase = await createAdminClient();
    const { data } = await supabase.from("settings").select("value").eq("key", "integrations").single();
    const settings = data?.value || {};

    if (settings.telegramBotToken) {
      const start = Date.now();
      const res = await fetch(`https://api.telegram.org/bot${settings.telegramBotToken}/getMe`, {
        signal: AbortSignal.timeout(5000),
      });
      const body = await res.json();
      results.telegram = { status: body.ok ? "ok" : "error", latency_ms: Date.now() - start };
    } else {
      results.telegram = { status: "error", error: "Not configured" };
    }

    // Check Resend
    if (settings.resendApiKey || process.env.RESEND_API_KEY) {
      results.email = { status: "ok" };
    } else {
      results.email = { status: "error", error: "Not configured" };
    }

    // Check Meta WhatsApp
    if (settings.metaWaEnabled && settings.metaWaAccessToken) {
      results.whatsapp = { status: "ok" };
    } else {
      results.whatsapp = { status: "error", error: "Not configured" };
    }
  } catch (e) {
    console.error("Health check - notifications error:", e);
    results.telegram = { status: "error", error: "Notification check failed" };
  }

  return results;
}

export async function GET() {
  const start = Date.now();

  const [supabase, ipaymu, notifications] = await Promise.all([
    checkSupabase(),
    checkIpaymu(),
    checkNotifications(),
  ]);

  const allOk = supabase.status === "ok" && ipaymu.status === "ok";
  const overallStatus = allOk ? "healthy" : "degraded";

  return NextResponse.json(
    {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      service: "etnyx",
      version: "2.0.0",
      uptime_check_ms: Date.now() - start,
      services: {
        supabase,
        ipaymu,
        ...notifications,
      },
    },
    {
      status: allOk ? 200 : 503,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
