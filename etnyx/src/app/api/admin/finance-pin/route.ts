import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual, createHash } from "crypto";
import { verifyAdmin } from "@/lib/admin-auth";

function safeCompare(a: string, b: string): boolean {
  try {
    const ha = createHash("sha256").update(a).digest();
    const hb = createHash("sha256").update(b).digest();
    return ha.length === hb.length && timingSafeEqual(ha, hb);
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  // Must be logged in as admin first
  const admin = await verifyAdmin();
  if (!admin.authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const financePin = process.env.FINANCE_PIN;
  if (!financePin) {
    return NextResponse.json({ error: "FINANCE_PIN belum dikonfigurasi di server. Tambahkan ke Vercel env vars." }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const pin: string = body?.pin ?? "";

  if (!pin) {
    return NextResponse.json({ error: "PIN diperlukan" }, { status: 400 });
  }

  if (!safeCompare(pin, financePin)) {
    return NextResponse.json({ error: "PIN salah" }, { status: 403 });
  }

  return NextResponse.json({ success: true });
}
