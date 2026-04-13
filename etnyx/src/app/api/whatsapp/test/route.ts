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
      .select("order_id, username, current_rank, target_rank, current_star, target_star, package, package_title, total_price, whatsapp, customer_email, status")
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
      email: order.customer_email,
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

  const template = searchParams.get("template"); // e.g. ?template=hello_world or ?template=order_confirmation

  let metaResult: Record<string, unknown> = { success: false };
  if (settings.metaWaEnabled && settings.metaWaAccessToken && settings.metaWaPhoneNumberId) {
    try {
      const normalizedPhone = phone.replace(/\D/g, "").replace(/^0/, "62");
      
      // Build message payload
      let messagePayload: Record<string, unknown>;
      if (template) {
        // Template test mode
        const isOrderCancelled = template === "order_cancelled";
        const buttonCount = template === "completed_order" ? 3 : isOrderCancelled ? 1 : 2;
        const buttonComponents = Array.from({ length: buttonCount }, (_, i) => ({
          type: "button",
          sub_type: "url",
          index: String(i),
          parameters: [{ type: "text", text: i === buttonCount - 1 ? "Halo min, saya mau tanya soal order ETX-TEST123" : "ETX-TEST123" }],
        }));

        messagePayload = {
          messaging_product: "whatsapp",
          to: normalizedPhone,
          type: "template",
          template: {
            name: template,
            language: { code: template === "hello_world" ? "en_US" : "id" },
            ...(template !== "hello_world" ? {
              components: [
                {
                  type: "header",
                  parameters: [
                    { type: "image", image: { link: "https://etnyx.com/logo/logo-bundar.png" } },
                  ],
                },
                {
                  type: "body",
                  parameters: isOrderCancelled
                    ? [
                        { type: "text", text: "ETX-TEST123" },
                        { type: "text", text: "TestUser" },
                      ]
                    : [
                        { type: "text", text: "ETX-TEST123" },
                        { type: "text", text: "Mythic" },
                        { type: "text", text: "Weekly" },
                        { type: "text", text: "Rp 50.000" },
                      ],
                },
                ...buttonComponents,
              ],
            } : {}),
          },
        };
      } else {
        // Plain text test mode
        messagePayload = {
          messaging_product: "whatsapp",
          to: normalizedPhone,
          type: "text",
          text: { body: "🧪 Test pesan dari ETNYX Bot. Kalau kamu terima ini, berarti WA API sudah berfungsi!" },
        };
      }

      const res = await fetch(
        `https://graph.facebook.com/v21.0/${settings.metaWaPhoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${settings.metaWaAccessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(messagePayload),
        }
      );

      const resBody = await res.json().catch(() => ({}));
      metaResult = {
        success: res.ok,
        httpStatus: res.status,
        normalizedPhone,
        requestPayload: messagePayload,
        response: resBody,
      };
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
