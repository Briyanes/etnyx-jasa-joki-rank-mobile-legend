import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { verifyAdmin } from "@/lib/admin-auth";

// ============================================
// DompetX connection test
// Validates API key by calling GET /saldo with DompetX auth headers
// ============================================

function buildAuthHeaders(apiKey: string, bodyString: string = "") {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = crypto
    .createHmac("sha256", apiKey)
    .update(timestamp + bodyString)
    .digest("hex");

  return {
    Accept: "application/json",
    "X-DOMPAY-API-Key": apiKey,
    "X-DOMPAY-Signature": signature,
    "X-DOMPAY-Timestamp": timestamp,
  };
}

export async function POST(req: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin.authenticated) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { apiKey, baseUrl } = await req.json();

    if (!apiKey) {
      return NextResponse.json({ success: false, error: "API Key belum diisi" }, { status: 400 });
    }

    const apiBaseUrl = baseUrl || "https://api.dompetx.com/v1";
    const authHeaders = buildAuthHeaders(apiKey);

    // Test connection by fetching balance via GET /saldo
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    let res: Response;
    try {
      res = await fetch(`${apiBaseUrl}/saldo`, {
        method: "GET",
        headers: authHeaders,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      return NextResponse.json({
        success: true,
        balance: data.balance ?? data.data?.balance ?? null,
      });
    }

    const errorData = await res.json().catch(() => ({}));
    return NextResponse.json({
      success: false,
      error: errorData.message || `HTTP ${res.status}`,
    });
  } catch (e) {
    return NextResponse.json({
      success: false,
      error: e instanceof Error ? e.message : "Network error",
    }, { status: 500 });
  }
}