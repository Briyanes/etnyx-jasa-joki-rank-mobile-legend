import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

// Public endpoint: returns which payment methods are available
export async function GET() {
  const supabase = createServiceClient();

  let ipaymuEnabled = false;

  // Check env vars first
  if (process.env.IPAYMU_API_KEY && process.env.IPAYMU_VA) {
    ipaymuEnabled = true;
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
      // If API key and VA are filled in dashboard, iPaymu is enabled
      if (integrations.ipaymuApiKey && integrations.ipaymuVa) {
        ipaymuEnabled = true;
      }
      // If dashboard explicitly has empty keys, disable even if env has keys
      if (integrations.ipaymuApiKey === "" || integrations.ipaymuVa === "") {
        ipaymuEnabled = false;
      }
    }
  } catch { /* no integrations setting yet */ }

  return NextResponse.json(
    { ipaymuEnabled, manualTransferEnabled: true },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
  );
}
