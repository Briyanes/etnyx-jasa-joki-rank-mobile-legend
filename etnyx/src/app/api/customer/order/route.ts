import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { sanitizeInput, isValidRank, isValidPhone } from "@/lib/validation";
import { encryptField, decryptField } from "@/lib/encryption";

// Re-export for backward compatibility
export { decryptField } from "@/lib/encryption";

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || "";
const MIDTRANS_IS_PRODUCTION = process.env.MIDTRANS_IS_PRODUCTION === "true";
const MIDTRANS_API_URL = MIDTRANS_IS_PRODUCTION
  ? "https://app.midtrans.com/snap/v1/transactions"
  : "https://app.sandbox.midtrans.com/snap/v1/transactions";

// Simple in-memory rate limiter
const orderRateLimit = new Map<string, number[]>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60_000; // 1 minute
  const maxRequests = 5;

  const timestamps = (orderRateLimit.get(ip) || []).filter(
    (t) => now - t < windowMs
  );
  if (timestamps.length >= maxRequests) return false;

  timestamps.push(now);
  orderRateLimit.set(ip, timestamps);
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Terlalu banyak request. Coba lagi nanti." },
        { status: 429 }
      );
    }

    const body = await request.json();

    // Validate required fields
    const {
      currentRank,
      targetRank,
      nickname,
      accountLogin,
      accountPassword,
      whatsapp,
      isExpress,
      isPremium,
      totalPrice,
    } = body;

    if (!currentRank || !targetRank || !nickname || !accountLogin || !accountPassword || !whatsapp) {
      return NextResponse.json(
        { error: "Data wajib belum lengkap" },
        { status: 400 }
      );
    }

    // Validate ranks (accept both mythicglory and mythical_glory)
    const normalizeRank = (r: string) =>
      r === "mythicglory" ? "mythical_glory" : r;
    const normCurrent = normalizeRank(currentRank);
    const normTarget = normalizeRank(targetRank);

    if (!isValidRank(normCurrent) || !isValidRank(normTarget)) {
      return NextResponse.json(
        { error: "Rank tidak valid" },
        { status: 400 }
      );
    }

    // Validate WhatsApp
    const cleanWhatsapp = whatsapp.replace(/\D/g, "");
    if (!isValidPhone(cleanWhatsapp)) {
      return NextResponse.json(
        { error: "Nomor WhatsApp tidak valid" },
        { status: 400 }
      );
    }

    // Validate price is positive
    if (!totalPrice || totalPrice <= 0 || totalPrice > 50_000_000) {
      return NextResponse.json(
        { error: "Harga tidak valid" },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const sanitizedNickname = sanitizeInput(nickname);
    const sanitizedLogin = sanitizeInput(accountLogin);
    const sanitizedHero = body.heroRequest
      ? sanitizeInput(body.heroRequest)
      : null;
    const sanitizedNotes = body.notes ? sanitizeInput(body.notes) : null;
    const sanitizedUserId = body.userId ? sanitizeInput(body.userId) : null;
    const sanitizedEmail = body.email ? sanitizeInput(body.email) : null;
    const sanitizedPackageTitle = body.packageTitle
      ? sanitizeInput(body.packageTitle)
      : null;

    // Encrypt sensitive credentials
    const encryptedPassword = encryptField(accountPassword);
    const encryptedLogin = encryptField(sanitizedLogin);

    // Generate order ID
    const orderId = `ETX-${Date.now().toString(36).toUpperCase()}`;

    // Determine package name from price
    const packageName =
      isExpress && isPremium
        ? "Express + Premium"
        : isExpress
        ? "Express"
        : isPremium
        ? "Premium"
        : "Standard";

    const supabase = await createAdminClient();

    // Insert order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_id: orderId,
        username: sanitizedNickname,
        game_id: sanitizedUserId || "",
        whatsapp: `+62${cleanWhatsapp}`,
        current_rank: currentRank,
        target_rank: targetRank,
        package: packageName,
        package_title: sanitizedPackageTitle,
        is_express: !!isExpress,
        is_premium: !!isPremium,
        base_price: body.promoDiscount ? totalPrice + body.promoDiscount : totalPrice,
        total_price: totalPrice,
        status: "pending",
        account_login: encryptedLogin,
        account_password: encryptedPassword,
        hero_request: sanitizedHero,
        notes: sanitizedNotes,
        login_method: body.loginMethod || "userid",
        customer_email: sanitizedEmail,
        promo_code: body.promoCode || null,
        promo_discount: body.promoDiscount || 0,
      })
      .select("id, order_id, total_price")
      .single();

    if (orderError) {
      console.error("Order insert error:", orderError);
      return NextResponse.json(
        { error: "Gagal membuat order" },
        { status: 500 }
      );
    }

    // Create Midtrans payment
    let paymentUrl: string | undefined;

    if (MIDTRANS_SERVER_KEY) {
      try {
        const midtransOrderId = `ETN-${orderId}-${Date.now()}`;

        const payload = {
          transaction_details: {
            order_id: midtransOrderId,
            gross_amount: totalPrice,
          },
          customer_details: {
            first_name: sanitizedNickname,
            email: sanitizedEmail || "customer@etnyx.com",
            phone: `+62${cleanWhatsapp}`,
          },
          item_details: [
            {
              id: orderId,
              price: totalPrice,
              quantity: 1,
              name: `Joki ML: ${currentRank} → ${targetRank}`,
            },
          ],
          callbacks: {
            finish: `${process.env.NEXT_PUBLIC_SITE_URL || ""}/payment/success?order_id=${orderId}`,
          },
        };

        const auth = Buffer.from(`${MIDTRANS_SERVER_KEY}:`).toString("base64");
        const midtransRes = await fetch(MIDTRANS_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${auth}`,
          },
          body: JSON.stringify(payload),
        });

        const midtransData = await midtransRes.json();

        if (midtransRes.ok && midtransData.redirect_url) {
          paymentUrl = midtransData.redirect_url;

          // Save payment info to order
          await supabase
            .from("orders")
            .update({
              payment_token: midtransData.token,
              payment_url: midtransData.redirect_url,
              midtrans_order_id: midtransOrderId,
            })
            .eq("id", order.id);
        }
      } catch (e) {
        console.error("Midtrans payment creation error:", e);
        // Order still created, payment can be retried
      }
    }

    // Log order creation
    await supabase.from("order_logs").insert({
      order_id: order.id,
      action: "created",
      new_value: "pending",
      notes: `Order created via website. ${paymentUrl ? "Payment link generated." : "Payment pending."}`,
      created_by: "system",
    });

    return NextResponse.json(
      {
        success: true,
        orderId: order.order_id,
        paymentUrl,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Public order creation error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan. Coba lagi." },
      { status: 500 }
    );
  }
}
