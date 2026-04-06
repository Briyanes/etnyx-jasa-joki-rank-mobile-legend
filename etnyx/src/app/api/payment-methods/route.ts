import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

// Public endpoint: returns which payment methods are available
export async function GET() {
  const supabase = await createServerSupabase();

  let midtransEnabled = false;

  // Check env vars first
  if (process.env.MIDTRANS_SERVER_KEY) {
    midtransEnabled = true;
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
      // If server key is filled in dashboard, Midtrans is enabled
      if (integrations.midtransServerKey) {
        midtransEnabled = true;
      }
      // If dashboard explicitly has empty keys, disable even if env has keys
      if (integrations.midtransServerKey === "") {
        midtransEnabled = false;
      }
    }
  } catch { /* no integrations setting yet */ }

  return NextResponse.json(
    { midtransEnabled, manualTransferEnabled: true },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
  );
}
