import { NextRequest, NextResponse } from "next/server";
import { WHATSAPP_NUMBER } from "@/lib/constants";

export async function GET(request: NextRequest) {
  const text = request.nextUrl.searchParams.get("text") || "Halo min, saya mau tanya";
  const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
  return NextResponse.redirect(waUrl);
}
