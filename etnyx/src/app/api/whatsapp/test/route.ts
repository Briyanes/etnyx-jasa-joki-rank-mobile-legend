import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

// Test endpoint — only accessible with admin auth
// GET /api/whatsapp/test?phone=628xxx
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const phone = searchParams.get("phone");
  const authHeader = request.headers.get("authorization");

  // Simple auth: must match CRON_SECRET
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!phone) {
    return NextResponse.json({ error: "Missing ?phone= parameter" }, { status: 400 });
  }

  // 1. Check DB settings
  const supabase = await createAdminClient();
  const { data: settingsData } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "integrations")
    .single();

  const settings = settingsData?.value || {};
  const diagnostics = {
    metaWaEnabled: !!settings.metaWaEnabled,
    metaWaPhoneNumberId: settings.metaWaPhoneNumberId || "(not set)",
    metaWaAccessToken: settings.metaWaAccessToken ? `${settings.metaWaAccessToken.slice(0, 15)}...` : "(not set)",
    fonnteApiToken: settings.fonnteApiToken ? `${settings.fonnteApiToken.slice(0, 10)}...` : "(not set)",
    fonnteDeviceId: settings.fonnteDeviceId || "(not set)",
  };

  // 2. Try sending test message via Meta
  let metaResult: { success: boolean; error?: unknown } = { success: false };
  if (settings.metaWaEnabled && settings.metaWaAccessToken && settings.metaWaPhoneNumberId) {
    try {
      const normalizedPhone = phone.replace(/\D/g, "").replace(/^0/, "62");
      const res = await fetch(
        `https://graph.facebook.com/v21.0/${settings.metaWaPhoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${settings.metaWaAccessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: normalizedPhone,
            type: "text",
            text: { body: "🧪 Test pesan dari ETNYX Bot. Kalau kamu terima ini, berarti WA API sudah berfungsi!" },
          }),
        }
      );

      const resBody = await res.json().catch(() => ({}));
      metaResult = res.ok ? { success: true } : { success: false, error: resBody };
    } catch (e) {
      metaResult = { success: false, error: String(e) };
    }
  } else {
    metaResult = { success: false, error: "Meta WA not configured or disabled" };
  }

  return NextResponse.json({
    diagnostics,
    metaResult,
    note: metaResult.success
      ? "Meta WA test message sent successfully!"
      : "Meta WA failed. Check error above. If error mentions 'template', you need approved templates for business-initiated messages.",
  });
}
