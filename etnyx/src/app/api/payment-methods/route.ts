import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { getDuitkuConfig } from "@/lib/payments/duitku";

// ============================================
// Public endpoint: returns which payment methods are available
// Duitku — customer picks method (QRIS/VA/e-wallet) on the Duitku
// checkout page, so we only expose the "is Duitku enabled" flag.
// ============================================

export async function GET() {
  const supabase = createServiceClient();
  const config = await getDuitkuConfig(supabase);
  const duitkuEnabled = Boolean(config.merchantCode && config.apiKey);

  return NextResponse.json(
    { duitkuEnabled, manualTransferEnabled: true },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
  );
}