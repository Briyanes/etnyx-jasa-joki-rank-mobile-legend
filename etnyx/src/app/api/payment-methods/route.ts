import { NextResponse } from "next/server";

// Public endpoint: returns which payment methods are available
export async function GET() {
  // Moota PG is enabled if API token is set
  const mootaEnabled = !!process.env.MOOTA_API_TOKEN;

  return NextResponse.json(
    { mootaEnabled, ipaymuEnabled: false, manualTransferEnabled: true },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
  );
}
