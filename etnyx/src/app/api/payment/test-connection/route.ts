import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { testDuitkuConnection } from "@/lib/payments/duitku";

// ============================================
// Duitku connection test (admin only)
// Validates credentials via transactionStatus probe.
// ============================================

export async function POST(req: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin.authenticated) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { merchantCode, apiKey, mode } = await req.json();

    if (!merchantCode || !apiKey) {
      return NextResponse.json(
        { success: false, error: "Merchant Code / API Key belum diisi" },
        { status: 400 }
      );
    }

    const result = await testDuitkuConnection({
      merchantCode: String(merchantCode),
      apiKey: String(apiKey),
      mode: mode === "live" ? "live" : "sandbox",
    });

    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Network error" },
      { status: 500 }
    );
  }
}