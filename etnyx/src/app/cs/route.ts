import { NextRequest, NextResponse } from "next/server";
import { WHATSAPP_NUMBER } from "@/lib/constants";

export async function GET(request: NextRequest) {
  const orderId = request.nextUrl.searchParams.get("order");
  const text = orderId
    ? `Halo CS ETNYX 👋\n\nSaya ingin follow up pesanan saya:\n📋 Order ID: *${orderId}*\n\nMohon bantuannya 🙏`
    : request.nextUrl.searchParams.get("text") || "Halo min, saya mau tanya";
  const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
  return NextResponse.redirect(waUrl);
}
