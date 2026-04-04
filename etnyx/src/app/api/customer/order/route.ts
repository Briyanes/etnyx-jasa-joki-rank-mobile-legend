import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { sanitizeInput, isValidRank, isValidPhone } from "@/lib/validation";
import { encryptField, decryptField } from "@/lib/encryption";
import crypto from "crypto";

// Re-export for backward compatibility
export { decryptField } from "@/lib/encryption";

const IPAYMU_API_KEY = process.env.IPAYMU_API_KEY || "";
const IPAYMU_VA = process.env.IPAYMU_VA || "";
const IPAYMU_IS_PRODUCTION = process.env.IPAYMU_IS_PRODUCTION === "true";

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

    // ===== SERVER-SIDE PROMO/REFERRAL RE-VALIDATION =====
    let verifiedDiscount = 0;
    let verifiedPromoCode: string | null = null;
    let promoId: string | null = null;
    let referrerId: string | null = null;

    if (body.promoCode) {
      const sanitizedPromoCode = String(body.promoCode).replace(/[^a-zA-Z0-9-]/g, "").toUpperCase();

      // Try promo code first
      const { data: promoResult } = await supabase.rpc("validate_promo_code", {
        p_code: sanitizedPromoCode,
        p_order_amount: totalPrice,
      });

      if (promoResult && promoResult.length > 0 && promoResult[0].valid) {
        verifiedDiscount = promoResult[0].calculated_discount;
        verifiedPromoCode = sanitizedPromoCode;
        promoId = promoResult[0].promo_id;
      } else {
        // Try referral code
        const { data: referrer } = await supabase
          .from("customers")
          .select("id, referral_code")
          .eq("referral_code", sanitizedPromoCode)
          .single();

        if (referrer) {
          // Self-referral check: compare by email or whatsapp
          const isSelfReferral =
            (sanitizedEmail && sanitizedEmail === referrer.referral_code) ||
            false;

          if (!isSelfReferral) {
            // Check duplicate: has this whatsapp already used this referral?
            const { data: existingReferral } = await supabase
              .from("referrals")
              .select("id")
              .eq("referrer_id", referrer.id)
              .eq("referred_whatsapp", `+62${cleanWhatsapp}`)
              .limit(1);

            if (!existingReferral || existingReferral.length === 0) {
              verifiedDiscount = Math.round(totalPrice * 0.1); // 10% referral discount
              verifiedPromoCode = sanitizedPromoCode;
              referrerId = referrer.id;
            }
          }
        }
      }
    }

    // Recalculate final price server-side (never trust client totalPrice with discount)
    const verifiedTotalPrice = Math.max(0, totalPrice - verifiedDiscount);
    const verifiedBasePrice = totalPrice;

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
        base_price: verifiedBasePrice,
        total_price: verifiedTotalPrice,
        status: "pending",
        account_login: encryptedLogin,
        account_password: encryptedPassword,
        hero_request: sanitizedHero,
        notes: sanitizedNotes,
        login_method: body.loginMethod || "userid",
        customer_email: sanitizedEmail,
        promo_code: verifiedPromoCode,
        promo_discount: verifiedDiscount,
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

    // Increment promo used_count if promo was applied
    if (promoId) {
      const { error: rpcErr } = await supabase.rpc("increment_promo_used_count", { p_promo_id: promoId });
      if (rpcErr) {
        // Fallback: manual increment if RPC doesn't exist
        const { data: promo } = await supabase
          .from("promo_codes")
          .select("used_count")
          .eq("id", promoId)
          .single();
        if (promo) {
          await supabase
            .from("promo_codes")
            .update({ used_count: (promo.used_count || 0) + 1 })
            .eq("id", promoId);
        }
      }
    }

    // Create referral record if referral was used
    if (referrerId) {
      const { error: refErr } = await supabase.from("referrals").insert({
        referrer_id: referrerId,
        referred_whatsapp: `+62${cleanWhatsapp}`,
        referred_order_id: order.id,
        reward_value: verifiedDiscount,
        reward_given: false,
      });
      if (refErr) console.error("Referral insert error:", refErr);
    }

    // Create iPaymu payment
    let paymentUrl: string | undefined;

    // Get iPaymu keys: prefer database (admin dashboard) over env
    let ipaymuApiKey = IPAYMU_API_KEY;
    let ipaymuVa = IPAYMU_VA;
    let ipaymuIsProduction = IPAYMU_IS_PRODUCTION;
    try {
      const { data: intSettings } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "integrations")
        .single();
      if (intSettings?.value?.ipaymuApiKey) {
        ipaymuApiKey = intSettings.value.ipaymuApiKey;
      }
      if (intSettings?.value?.ipaymuVa) {
        ipaymuVa = intSettings.value.ipaymuVa;
      }
      if (intSettings?.value?.ipaymuIsProduction !== undefined) {
        ipaymuIsProduction = intSettings.value.ipaymuIsProduction;
      }
    } catch { /* fallback to env */ }

    const ipaymuBaseUrl = ipaymuIsProduction
      ? "https://my.ipaymu.com"
      : "https://sandbox.ipaymu.com";

    if (ipaymuApiKey && ipaymuVa) {
      try {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
        const ipaymuBody = {
          product: [`Joki ML: ${currentRank} to ${targetRank}`],
          qty: ["1"],
          price: [String(verifiedTotalPrice)],
          amount: String(verifiedTotalPrice),
          returnUrl: `${siteUrl}/payment/success?order_id=${orderId}`,
          cancelUrl: `${siteUrl}/payment/success?order_id=${orderId}&transaction_status=cancel`,
          notifyUrl: `${siteUrl}/api/payment/notification`,
          referenceId: orderId,
          buyerName: sanitizedNickname,
          buyerPhone: `62${cleanWhatsapp}`,
          buyerEmail: sanitizedEmail || "customer@etnyx.com",
        };

        const bodyStr = JSON.stringify(ipaymuBody);
        const bodyHash = crypto.createHash("sha256").update(bodyStr).digest("hex");
        const stringToSign = `POST:${ipaymuVa}:${bodyHash}:${ipaymuApiKey}`;
        const signature = crypto.createHmac("sha256", ipaymuApiKey).update(stringToSign).digest("hex");

        const ipaymuRes = await fetch(`${ipaymuBaseUrl}/api/v2/payment`, {
          method: "POST",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "va": ipaymuVa,
            "signature": signature,
            "timestamp": new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14),
          },
          body: bodyStr,
        });

        const ipaymuData = await ipaymuRes.json();
        console.log("iPaymu response:", JSON.stringify(ipaymuData));

        if (ipaymuData.Status === 200 && ipaymuData.Data?.Url) {
          paymentUrl = ipaymuData.Data.Url;

          // Save payment info to order
          await supabase
            .from("orders")
            .update({
              payment_url: ipaymuData.Data.Url,
              payment_token: String(ipaymuData.Data.SessionId || ""),
              midtrans_order_id: orderId,
            })
            .eq("id", order.id);
        } else {
          console.error("iPaymu error:", JSON.stringify(ipaymuData));
        }
      } catch (e) {
        console.error("iPaymu payment creation error:", e);
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
        totalPrice: verifiedTotalPrice,
        discount: verifiedDiscount,
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
