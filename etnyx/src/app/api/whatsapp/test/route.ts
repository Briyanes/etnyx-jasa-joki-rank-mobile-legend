import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { sendOrderConfirmationWA } from "@/lib/notifications";

// Test endpoint — accessible with JWT_SECRET or CRON_SECRET
// GET /api/whatsapp/test?phone=628xxx
// GET /api/whatsapp/test?order_id=ETX-xxx (test full order flow)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const phone = searchParams.get("phone");
  const orderId = searchParams.get("order_id");
  const authHeader = request.headers.get("authorization");

  // Simple auth: must match CRON_SECRET or JWT_SECRET
  const cronSecret = process.env.CRON_SECRET;
  const jwtSecret = process.env.JWT_SECRET;
  const token = authHeader?.replace("Bearer ", "");
  if (!token || (token !== cronSecret && token !== jwtSecret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!phone && !orderId) {
    return NextResponse.json({ error: "Missing ?phone= or ?order_id= parameter" }, { status: 400 });
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
  };

  // 2. If order_id provided, test the full sendOrderConfirmationWA flow
  if (orderId) {
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("order_id, username, current_rank, target_rank, current_star, target_star, package, package_title, total_price, whatsapp, email, status")
      .eq("order_id", orderId)
      .single();

    if (!order || orderError) {
      return NextResponse.json({ 
        error: `Order ${orderId} not found`, 
        dbError: orderError?.message || null,
        hint: "Check if order_id matches exactly (case-sensitive)"
      }, { status: 404 });
    }

    const result = await sendOrderConfirmationWA({
      order_id: order.order_id,
      username: order.username,
      current_rank: order.current_rank,
      target_rank: order.target_rank,
      current_star: order.current_star,
      target_star: order.target_star,
      package: order.package,
      package_title: order.package_title,
      price: order.total_price,
      whatsapp: order.whatsapp,
      email: order.email,
      status: order.status,
    });

    return NextResponse.json({
      diagnostics,
      orderPhone: order.whatsapp,
      sendResult: result,
      note: result ? "Order confirmation WA sent!" : "FAILED to send order confirmation WA. Check Vercel function logs for details.",
    });
  }

  // 2. Try sending test message via Meta (only if phone provided)
  if (!phone) {
    return NextResponse.json({ error: "Missing ?phone= parameter for direct test" }, { status: 400 });
  }

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
