import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { verifyAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase-server";

// ============================================
// DompetX Debug Endpoint (Admin-only)
// Makes a real test checkout call to DompetX and returns the RAW response
// so we can see exactly what fields DompetX returns.
// Usage: POST /api/payment/debug { amount: 1000 }
// ============================================

function buildAuthHeaders(apiKey: string, bodyString: string) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = crypto
    .createHmac("sha256", apiKey)
    .update(timestamp + bodyString)
    .digest("hex");

  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-DOMPAY-API-Key": apiKey,
    "X-DOMPAY-Signature": signature,
    "X-DOMPAY-Timestamp": timestamp,
  };
}

export async function POST(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin.authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const testAmount = Number(body.amount) || 1000;

    const supabase = await createAdminClient();

    // Get DompetX settings from DB or env
    let apiKey = process.env.DOMPETX_API_KEY || "";
    let baseUrl = process.env.DOMPETX_BASE_URL || "https://api.dompetx.com/v1";

    try {
      const { data: intSettings } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "integrations")
        .single();
      if (intSettings?.value?.dompetxApiKey) apiKey = intSettings.value.dompetxApiKey;
      if (intSettings?.value?.dompetxBaseUrl) baseUrl = intSettings.value.dompetxBaseUrl;
    } catch { /* use env */ }

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: "DOMPETX_API_KEY not configured",
        envCheck: {
          hasEnvKey: !!process.env.DOMPETX_API_KEY,
          baseUrl: baseUrl,
        },
      }, { status: 400 });
    }

    // Build a minimal test checkout
    const refId = `DEBUG-${Date.now()}`;
    const checkoutBody = {
      amount: testAmount,
      currency: "IDR",
      reference: refId,
      redirectUrl: "https://etnyx.com/payment/debug-callback",
      metadata: {
        order_name: `Debug Test ${refId}`,
        product_name: "Debug Test",
        customer_name: "Admin Debug",
        customer_email: "debug@etnyx.com",
        notes: "Debug test — do not process",
      },
    };

    const bodyString = JSON.stringify(checkoutBody);
    const authHeaders = buildAuthHeaders(apiKey, bodyString);

    // 30 second timeout for debug
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    let res: Response;
    let rawText = "";
    try {
      res = await fetch(`${baseUrl}/payments/checkout`, {
        method: "POST",
        headers: authHeaders,
        body: bodyString,
        signal: controller.signal,
      });
      rawText = await res.text();
    } finally {
      clearTimeout(timeoutId);
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = rawText.slice(0, 1000);
    }

    return NextResponse.json({
      success: res.ok,
      status: res.status,
      statusText: res.statusText,
      request: {
        url: `${baseUrl}/payments/checkout`,
        method: "POST",
        body: checkoutBody,
        headers: {
          ...authHeaders,
          // Mask API key for security
          "X-DOMPAY-API-Key": apiKey.slice(0, 8) + "..." + apiKey.slice(-4),
        },
      },
      response: {
        raw: typeof parsed === "string" ? parsed : undefined,
        parsed: typeof parsed === "object" ? parsed : undefined,
        headers: Object.fromEntries(res.headers.entries()),
      },
      analysis: typeof parsed === "object" && parsed !== null ? {
        topLevelKeys: Object.keys(parsed as Record<string, unknown>),
        hasDataField: "data" in (parsed as Record<string, unknown>),
        dataKeys:
          (parsed as Record<string, unknown>).data && typeof (parsed as Record<string, unknown>).data === "object"
            ? Object.keys((parsed as Record<string, unknown>).data as Record<string, unknown>)
            : null,
      } : null,
    });
  } catch (error) {
    console.error("Debug payment error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      isTimeout: error instanceof Error && error.name === "AbortError",
    }, { status: 500 });
  }
}