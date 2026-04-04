import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { apiKey, va, isProduction } = await req.json();

    if (!apiKey || !va) {
      return NextResponse.json({ success: false, error: "API Key dan VA belum diisi" }, { status: 400 });
    }

    const baseUrl = isProduction
      ? "https://my.ipaymu.com"
      : "https://sandbox.ipaymu.com";

    // Use iPaymu balance check API to verify credentials
    const body = JSON.stringify({ account: va });
    const bodyHash = crypto.createHash("sha256").update(body).digest("hex");
    const stringToSign = `POST:${va}:${bodyHash}:${apiKey}`;
    const signature = crypto.createHmac("sha256", apiKey).update(stringToSign).digest("hex");

    const res = await fetch(`${baseUrl}/api/v2/balance`, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "va": va,
        "signature": signature,
        "timestamp": new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14),
      },
      body: body,
    });

    const data = await res.json();

    if (res.ok && data.Status === 200) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({
      success: false,
      error: data.Message || `HTTP ${res.status}`,
    });
  } catch (e) {
    return NextResponse.json({
      success: false,
      error: e instanceof Error ? e.message : "Network error",
    }, { status: 500 });
  }
}
