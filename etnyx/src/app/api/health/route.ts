import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { isR2Configured } from "@/lib/r2";
import { getDuitkuConfig, testDuitkuConnection } from "@/lib/payments/duitku";

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

async function checkDuitku(): Promise<ServiceStatus> {
  const start = Date.now();

  try {
    const supabase = await createAdminClient();
    const config = await getDuitkuConfig(supabase);

    if (!config.merchantCode || !config.apiKey) {
      return { status: "error", error: "Not configured" };
    }

    const result = await testDuitkuConnection(config);
    return {
      status: result.success ? "ok" : "error",
      latency_ms: Date.now() - start,
      ...(result.success ? {} : { error: result.message || "Duitku unreachable" }),
    };
  } catch (e) {
    console.error("Health check - Duitku error:", e);
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

  const [supabase, duitku, notifications] = await Promise.all([
    checkSupabase(),
    checkDuitku(),
    checkNotifications(),
  ]);

  const allOk = supabase.status === "ok" && duitku.status === "ok";
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
        duitku,
        storage: {
          provider: isR2Configured() ? "r2" : "supabase",
          r2_configured: isR2Configured(),
          bucket: process.env.R2_BUCKET_NAME || "etnyx-storage",
        },
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
