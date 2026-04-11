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

function getIpaymuUrl(isProduction: boolean) {
  return isProduction
    ? "https://my.ipaymu.com/api/v2/payment"
    : "https://sandbox.ipaymu.com/api/v2/payment";
}

function generateIpaymuSignature(body: object, va: string, apiKey: string): string {
  const bodyHash = crypto.createHash("sha256").update(JSON.stringify(body)).digest("hex");
  const stringToSign = `POST:${va}:${bodyHash}:${apiKey}`;
  return crypto.createHmac("sha256", apiKey).update(stringToSign).digest("hex");
}

function getIpaymuTimestamp(): string {
  const now = new Date();
  return now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0") +
    String(now.getHours()).padStart(2, "0") +
    String(now.getMinutes()).padStart(2, "0") +
    String(now.getSeconds()).padStart(2, "0");
}

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

    // Extract UTM attribution params (sanitized)
    const utmSource = body.utm_source ? String(body.utm_source).replace(/[^a-zA-Z0-9_.-]/g, "").slice(0, 100) : null;
    const utmMedium = body.utm_medium ? String(body.utm_medium).replace(/[^a-zA-Z0-9_.-]/g, "").slice(0, 100) : null;
    const utmCampaign = body.utm_campaign ? String(body.utm_campaign).replace(/[^a-zA-Z0-9_. -]/g, "").slice(0, 200) : null;
    const utmContent = body.utm_content ? String(body.utm_content).replace(/[^a-zA-Z0-9_. -]/g, "").slice(0, 200) : null;
    const utmTerm = body.utm_term ? String(body.utm_term).replace(/[^a-zA-Z0-9_. -]/g, "").slice(0, 200) : null;
    const fbclid = body.fbclid ? String(body.fbclid).replace(/[^a-zA-Z0-9_.-]/g, "").slice(0, 500) : null;
    const gclid = body.gclid ? String(body.gclid).replace(/[^a-zA-Z0-9_.-]/g, "").slice(0, 500) : null;
    const ttclid = body.ttclid ? String(body.ttclid).replace(/[^a-zA-Z0-9_.-]/g, "").slice(0, 500) : null;
    const referrerUrl = body.referrer_url ? String(body.referrer_url).slice(0, 500) : null;

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

    const isGendong = body.orderType === "gendong";

    if (!currentRank || !targetRank || !nickname || !whatsapp) {
      return NextResponse.json(
        { error: "Data wajib belum lengkap" },
        { status: 400 }
      );
    }
    // For non-gendong: require login credentials
    if (!isGendong && (!accountLogin || !accountPassword)) {
      return NextResponse.json(
        { error: "Data login akun wajib diisi" },
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
    const sanitizedLogin = accountLogin ? sanitizeInput(accountLogin) : null;
    const sanitizedHero = body.heroRequest
      ? sanitizeInput(body.heroRequest)
      : null;
    const sanitizedNotes = body.notes ? sanitizeInput(body.notes) : null;
    const sanitizedUserId = body.userId ? sanitizeInput(body.userId) : null;
    const sanitizedEmail = body.email ? sanitizeInput(body.email) : null;
    const sanitizedPackageTitle = body.packageTitle
      ? sanitizeInput(body.packageTitle)
      : null;

    // Encrypt sensitive credentials (skip for gendong/mabar - no login needed)
    const encryptedPassword = accountPassword ? encryptField(accountPassword) : null;
    const encryptedLogin = sanitizedLogin ? encryptField(sanitizedLogin) : null;

    // Generate order ID
    const orderId = `ETX-${Date.now().toString(36).toUpperCase()}${crypto.randomUUID().slice(0, 4).toUpperCase()}`;

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
          // Self-referral check: compare by customer ID or email
          let isSelfReferral = false;
          if (sanitizedEmail) {
            const { data: selfCheck } = await supabase
              .from("customers")
              .select("id")
              .eq("email", sanitizedEmail.toLowerCase())
              .single();
            isSelfReferral = !!selfCheck && selfCheck.id === referrer.id;
          }

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
    // Tier discount: look up customer tier by email or whatsapp
    let verifiedTierDiscount = 0;
    if (sanitizedEmail || cleanWhatsapp) {
      try {
        let customerQuery = supabase.from("customers").select("reward_tier");
        if (sanitizedEmail) {
          customerQuery = customerQuery.eq("email", sanitizedEmail);
        } else {
          customerQuery = customerQuery.eq("whatsapp", `+62${cleanWhatsapp}`);
        }
        const { data: cust } = await customerQuery.single();
        if (cust?.reward_tier) {
          const tierDiscountPct = cust.reward_tier === "platinum" ? 8 : cust.reward_tier === "gold" ? 5 : cust.reward_tier === "silver" ? 3 : 0;
          verifiedTierDiscount = Math.round(totalPrice * tierDiscountPct / 100);
        }
      } catch { /* not a member or not found */ }
    }

    const verifiedTotalPrice = Math.max(0, totalPrice - verifiedDiscount - verifiedTierDiscount);
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
        current_star: body.currentStar ?? null,
        target_star: body.targetStar ?? null,
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
        login_method: isGendong ? null : (body.loginMethod || "userid"),
        customer_email: sanitizedEmail,
        promo_code: verifiedPromoCode,
        promo_discount: verifiedDiscount,
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
        utm_content: utmContent,
        utm_term: utmTerm,
        fbclid,
        gclid,
        ttclid,
        referrer_url: referrerUrl,
        payment_method: body.paymentMethod === "manual_transfer" ? "manual_transfer" : "ipaymu",
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

    // Increment promo used_count if promo was applied (atomic via RPC)
    if (promoId) {
      const { error: rpcErr } = await supabase.rpc("increment_promo_used_count", { p_promo_id: promoId });
      if (rpcErr) {
        console.error("Failed to increment promo used_count:", rpcErr);
      } else {
        // Post-increment check: if used_count now exceeds max_uses, the promo was over-used (race condition)
        const { data: promoCheck } = await supabase
          .from("promo_codes")
          .select("used_count, max_uses")
          .eq("id", promoId)
          .single();
        if (promoCheck?.max_uses && promoCheck.used_count > promoCheck.max_uses) {
          // Revert: decrement back and remove discount from order
          const { error: decErr } = await supabase.rpc("decrement_promo_used_count", { p_promo_id: promoId });
          if (decErr) {
            // Fallback: direct update if RPC doesn't exist
            await supabase.from("promo_codes").update({ used_count: promoCheck.max_uses }).eq("id", promoId);
          }
          await supabase.from("orders").update({
            promo_code: null,
            promo_discount: 0,
            total_price: verifiedBasePrice,
          }).eq("id", order.id);
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

    // Create iPaymu payment (only for auto/ipaymu payment method)
    let paymentUrl: string | undefined;
    const isManualTransfer = body.paymentMethod === "manual_transfer";

    if (!isManualTransfer) {
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

    const ipaymuApiUrl = getIpaymuUrl(ipaymuIsProduction);

    if (ipaymuApiKey && ipaymuVa) {
      try {
        const ipaymuRefId = `ETN-${orderId}-${Date.now()}`;

        const ipaymuBody = {
          product: [`Joki ML: ${currentRank} to ${targetRank}`],
          qty: ["1"],
          price: [String(verifiedTotalPrice)],
          amount: String(verifiedTotalPrice),
          returnUrl: `${process.env.NEXT_PUBLIC_SITE_URL || ""}/payment/success?order_id=${orderId}`,
          cancelUrl: `${process.env.NEXT_PUBLIC_SITE_URL || ""}/payment/success?order_id=${orderId}&transaction_status=cancel`,
          notifyUrl: `${process.env.NEXT_PUBLIC_SITE_URL || ""}/api/payment/notification`,
          referenceId: ipaymuRefId,
          buyerName: sanitizedNickname,
          buyerPhone: `+62${cleanWhatsapp}`,
          buyerEmail: sanitizedEmail || "customer@etnyx.com",
        };

        const signature = generateIpaymuSignature(ipaymuBody, ipaymuVa, ipaymuApiKey);

        const ipaymuRes = await fetch(ipaymuApiUrl, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            va: ipaymuVa,
            signature,
            timestamp: getIpaymuTimestamp(),
          },
          body: JSON.stringify(ipaymuBody),
        });

        const ipaymuData = await ipaymuRes.json();

        if (ipaymuRes.ok && ipaymuData.Status === 200 && ipaymuData.Data?.Url) {
          paymentUrl = ipaymuData.Data.Url;

          // Save payment info to order
          await supabase
            .from("orders")
            .update({
              payment_token: ipaymuData.Data.SessionId || null,
              payment_url: ipaymuData.Data.Url,
              midtrans_order_id: ipaymuRefId,
            })
            .eq("id", order.id);
        } else {
          console.error("iPaymu error:", ipaymuRes.status, JSON.stringify(ipaymuData), "URL:", ipaymuApiUrl, "VA:", ipaymuVa?.slice(0,6) + "...");
          // iPaymu failed — fallback to manual transfer
          await supabase
            .from("orders")
            .update({ payment_method: "manual_transfer" })
            .eq("id", order.id);
        }
      } catch (e) {
        console.error("iPaymu payment creation error:", e);
        // iPaymu failed — fallback to manual transfer
        await supabase
          .from("orders")
          .update({ payment_method: "manual_transfer" })
          .eq("id", order.id);
      }
    }
    } // end if (!isManualTransfer)

    // If iPaymu was selected but failed (no paymentUrl), send follow-up WA for manual payment
    const ipaymuFailed = !isManualTransfer && !paymentUrl;
    if (ipaymuFailed) {
      try {
        // Fetch bank accounts for the follow-up message
        let paymentInfo = "";
        try {
          const { data: bankSettings } = await supabase
            .from("settings")
            .select("value")
            .eq("key", "bank_accounts")
            .single();
          if (bankSettings?.value && Array.isArray(bankSettings.value)) {
            const activeAccounts = (bankSettings.value as { bank: string; account_number: string; account_name: string; is_active: boolean }[])
              .filter((a) => a.is_active);
            if (activeAccounts.length > 0) {
              const bankList = activeAccounts
                .map((a) => `• *${a.bank}*: ${a.account_number} (a.n. ${a.account_name})`)
                .join("\n");
              paymentInfo = `\n\n💳 *Transfer ke salah satu rekening berikut:*\n${bankList}`;
            }
          }
        } catch { /* no bank accounts configured */ }

        const uploadUrl = `${process.env.NEXT_PUBLIC_SITE_URL || ""}/payment/manual/?order_id=${orderId}`;
        const fallbackMsg = `Halo kak!\n\nIni dari *ETNYX*. Pembayaran otomatis sedang bermasalah, mohon maaf atas ketidaknyamanannya.\n\nSilakan lakukan pembayaran manual untuk order berikut:\n\n*Order ID:* ${orderId}\n*Paket:* ${sanitizedPackageTitle || packageName}\n*Total:* Rp ${verifiedTotalPrice.toLocaleString("id-ID")}${paymentInfo}\n\nSetelah transfer, upload bukti di sini:\n${uploadUrl}\n\nAda pertanyaan? Balas pesan ini aja~\n\n_ETNYX - Push Rank, Tanpa Main_`;

        const { sendWhatsAppMessage } = await import("@/lib/notifications");
        await sendWhatsAppMessage(`+62${cleanWhatsapp}`, fallbackMsg, uploadUrl);
      } catch (e) {
        console.error("iPaymu fallback WA error:", e);
      }
    }

    // Log order creation
    await supabase.from("order_logs").insert({
      order_id: order.id,
      action: "created",
      new_value: "pending",
      notes: `Order created via website. ${isManualTransfer ? "Manual transfer." : paymentUrl ? "Payment link generated." : "iPaymu gagal, fallback ke manual transfer."}`,
      created_by: "system",
    });

    // Send WA confirmation + Telegram admin notification for new order
    try {
      const { sendOrderConfirmationWA, notifyAdminNewOrder } = await import("@/lib/notifications");
      await Promise.allSettled([
        sendOrderConfirmationWA({
          order_id: order.order_id,
          username: sanitizedNickname,
          current_rank: currentRank,
          target_rank: targetRank,
          current_star: body.currentStar ?? null,
          target_star: body.targetStar ?? null,
          package: packageName,
          package_title: sanitizedPackageTitle,
          price: verifiedTotalPrice,
          whatsapp: `+62${cleanWhatsapp}`,
          email: sanitizedEmail || undefined,
          status: "pending",
        }),
        notifyAdminNewOrder({
          order_id: order.order_id,
          username: sanitizedNickname,
          current_rank: currentRank,
          target_rank: targetRank,
          current_star: body.currentStar ?? null,
          target_star: body.targetStar ?? null,
          package: packageName,
          package_title: sanitizedPackageTitle,
          price: verifiedTotalPrice,
          whatsapp: `+62${cleanWhatsapp}`,
          email: sanitizedEmail || undefined,
          status: "pending",
          is_express: body.isExpress,
          is_premium: body.isPremium,
          notes: body.notes,
        }),
      ]);
    } catch (e) {
      console.error("Order notification error:", e);
    }

    return NextResponse.json(
      {
        success: true,
        orderId: order.order_id,
        totalPrice: verifiedTotalPrice,
        discount: verifiedDiscount,
        paymentUrl,
        paymentMethod: isManualTransfer || (!isManualTransfer && !paymentUrl) ? "manual_transfer" : "ipaymu",
        ipaymuFailed: !isManualTransfer && !paymentUrl,
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
