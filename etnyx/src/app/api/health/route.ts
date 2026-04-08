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
    return { status: "error", latency_ms: Date.now() - start, error: String(e) };
  }
}

async function checkMidtrans(): Promise<ServiceStatus> {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) return { status: "error", error: "Not configured" };

  const start = Date.now();
  try {
    const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";
    const baseUrl = isProduction
      ? "https://api.midtrans.com"
      : "https://api.sandbox.midtrans.com";

    const res = await fetch(`${baseUrl}/v2/ping`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(5000),
    });
    return { status: res.ok ? "ok" : "error", latency_ms: Date.now() - start };
  } catch (e) {
    return { status: "error", latency_ms: Date.now() - start, error: String(e) };
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

    // Check Fonnte (WhatsApp)
    if (settings.fonnteApiToken) {
      results.whatsapp = { status: "ok" };
    } else {
      results.whatsapp = { status: "error", error: "Not configured" };
    }
  } catch (e) {
    results.telegram = { status: "error", error: String(e) };
  }

  return results;
}

export async function GET() {
  const start = Date.now();

  const [supabase, midtrans, notifications] = await Promise.all([
    checkSupabase(),
    checkMidtrans(),
    checkNotifications(),
  ]);

  const allOk = supabase.status === "ok" && midtrans.status === "ok";
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
        midtrans,
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
