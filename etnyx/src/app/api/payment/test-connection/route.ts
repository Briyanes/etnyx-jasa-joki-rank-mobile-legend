import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin.authenticated) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { apiKey, va, isProduction: isProd } = await req.json();

    if (!apiKey || !va) {
      return NextResponse.json({ success: false, error: "API Key dan VA belum diisi" }, { status: 400 });
    }

    const isProduction = isProd ?? false;
    const url = isProduction
      ? "https://my.ipaymu.com/api/v2/balance"
      : "https://sandbox.ipaymu.com/api/v2/balance";

    const body = { account: va };
    const bodyHash = crypto.createHash("sha256").update(JSON.stringify(body)).digest("hex");
    const stringToSign = `POST:${va}:${bodyHash}:${apiKey}`;
    const signature = crypto.createHmac("sha256", apiKey).update(stringToSign).digest("hex");

    const now = new Date();
    const timestamp = now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, "0") +
      String(now.getDate()).padStart(2, "0") +
      String(now.getHours()).padStart(2, "0") +
      String(now.getMinutes()).padStart(2, "0") +
      String(now.getSeconds()).padStart(2, "0");

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        va,
        signature,
        timestamp,
      },
      body: JSON.stringify(body),
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
