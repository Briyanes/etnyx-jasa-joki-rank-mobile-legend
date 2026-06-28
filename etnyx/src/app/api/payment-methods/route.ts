import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

// ============================================
// Public endpoint: returns which payment methods are available
// DompetX Basic Merchant - customer picks method on DompetX checkout page
// so we only expose the "is DompetX enabled" flag.
// ============================================

export async function GET() {
  const supabase = createServiceClient();

  let dompetxEnabled = false;

  // Check env var first
  if (process.env.DOMPETX_API_KEY) {
    dompetxEnabled = true;
  }

  // Check database integrations (admin dashboard config overrides)
  try {
    const { data } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "integrations")
      .single();

    if (data?.value) {
      const integrations = data.value;
      // If API key is filled in dashboard, DompetX is enabled
      if (integrations.dompetxApiKey) {
        dompetxEnabled = true;
      }
      // If dashboard explicitly has empty key, disable even if env has key
      if (integrations.dompetxApiKey === "") {
        dompetxEnabled = false;
      }
    }
  } catch { /* no integrations setting yet */ }

  return NextResponse.json(
    { dompetxEnabled, manualTransferEnabled: true },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
  );
}