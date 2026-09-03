import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { getDuitkuConfig, createDuitkuCheckout } from "@/lib/payments/duitku";
import {
  sanitizeInput,
  isValidRank,
  isValidPhone,
  sanitizeBonusStars,
  isValidOrderType,
  isValidPaymentMethod,
  isValidLoginMethod,
} from "@/lib/validation";
import { encryptField, decryptField } from "@/lib/encryption";
import { calculateServerPrice, type CMSPricing } from "@/lib/pricing-engine";
import {
  checkOrderRateLimit,
  checkAutoBan,
  MAX_PENDING_PER_WA,
  AUTO_BAN_THRESHOLD,
} from "@/lib/rate-limiter";
import crypto from "crypto";

// Re-export for backward compatibility
export { decryptField } from "@/lib/encryption";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://etnyx.com");

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";

    // ===== Anti-Spam Layer 1: Order rate limit (5/hour, 10/day per IP) =====
    const orderRateResult = await checkOrderRateLimit(ip);
    if (!orderRateResult.allowed) {
      return NextResponse.json(
        { error: orderRateResult.reason || "Terlalu banyak order. Coba lagi nanti." },
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
      bonusStars,
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

    // Normalize rank aliases to canonical form
    const normalizeRank = (r: string) => {
      const s = r.toLowerCase();
      if (s === "grading") return "mythicgrading";
      if (s === "honor") return "mythichonor";
      if (s === "glory") return "mythicglory";
      if (s === "immortal") return "mythicimmortal";
      if (s === "mythical_glory") return "mythicglory";
      return s;
    };
    const normCurrent = normalizeRank(currentRank);
    const normTarget = normalizeRank(targetRank);

    if (!isValidRank(normCurrent) || !isValidRank(normTarget)) {
      return NextResponse.json(
        { error: "Rank tidak valid" },
        { status: 400 }
      );
    }

    // Validate rank hierarchy: target must be higher than current
    const RANK_ORDER = ["warrior","elite","master","grandmaster","epic","legend","mythicgrading","mythic","mythichonor","mythicglory","mythicimmortal"];
    const currentIdx = RANK_ORDER.indexOf(normCurrent);
    const targetIdx = RANK_ORDER.indexOf(normTarget);
    if (currentIdx >= 0 && targetIdx >= 0 && currentIdx >= targetIdx && normCurrent !== normTarget) {
      return NextResponse.json(
        { error: "Target rank harus lebih tinggi dari rank saat ini" },
        { status: 400 }
      );
    }

    // Validate WhatsApp
    const rawWhatsapp = whatsapp.replace(/\D/g, "");
    const cleanWhatsapp = rawWhatsapp.startsWith("0") ? rawWhatsapp.slice(1) : rawWhatsapp.startsWith("62") ? rawWhatsapp.slice(2) : rawWhatsapp;
    if (!isValidPhone(rawWhatsapp)) {
      return NextResponse.json(
        { error: "Nomor WhatsApp tidak valid" },
        { status: 400 }
      );
    }

    // ===== Anti-Spam Layer 2: Check banned WA + email + game_id + pending limit =====
    const fullWhatsapp = `+62${cleanWhatsapp}`;
    const supabase = await createAdminClient();

    const rawEmail = body.email ? String(body.email).trim().toLowerCase() : null;
    // Extract userId only (before parentheses) — game_id stored as "userId(serverId)"
    const rawGameId = body.userId
      ? String(body.userId).split("(")[0].replace(/\D/g, "")
      : null;

    const [bannedWaRes, bannedEmailRes, bannedGameIdRes] = await Promise.all([
      supabase.from("banned_whatsapp").select("id").eq("whatsapp", fullWhatsapp).limit(1),
      rawEmail
        ? supabase.from("banned_emails").select("id").eq("email", rawEmail).limit(1)
        : Promise.resolve({ data: null }),
      rawGameId
        ? supabase.from("banned_game_ids").select("id").eq("game_id", rawGameId).limit(1)
        : Promise.resolve({ data: null }),
    ]);

    if (bannedWaRes.data && bannedWaRes.data.length > 0) {
      return NextResponse.json(
        { error: "Nomor Anda diblokir dari layanan kami. Hubungi admin." },
        { status: 403 }
      );
    }
    if (bannedEmailRes.data && bannedEmailRes.data.length > 0) {
      return NextResponse.json(
        { error: "Email Anda diblokir dari layanan kami. Hubungi admin." },
        { status: 403 }
      );
    }
    if (bannedGameIdRes.data && bannedGameIdRes.data.length > 0) {
      return NextResponse.json(
        { error: "Akun game Anda diblokir dari layanan kami. Hubungi admin." },
        { status: 403 }
      );
    }

    // Check max pending orders for this WhatsApp number
    const { count: pendingCount } = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("whatsapp", fullWhatsapp)
      .in("status", ["pending", "confirmed", "in_progress"]);

    if (pendingCount && pendingCount >= MAX_PENDING_PER_WA) {
      return NextResponse.json(
        { error: `Anda memiliki ${pendingCount} order yang sedang diproses. Selesaikan atau tunggu order tersebut selesai sebelum membuat order baru.` },
        { status: 429 }
      );
    }

    // ===== Anti-Spam Layer 3: Auto-ban if IP exceeds threshold =====
    const shouldAutoBan = await checkAutoBan(ip);
    if (shouldAutoBan) {
      // Auto-ban the IP
      await supabase.from("banned_ips").upsert({
        ip_address: ip,
        reason: `Auto-banned: exceeded ${AUTO_BAN_THRESHOLD} orders in 1 hour`,
        auto_banned: true,
        banned_by: "system",
      }, { onConflict: "ip_address", ignoreDuplicates: true });

      // Also ban the WhatsApp number
      await supabase.from("banned_whatsapp").upsert({
        whatsapp: fullWhatsapp,
        reason: `Auto-banned: spam from IP ${ip}`,
        auto_banned: true,
        banned_by: "system",
      }, { onConflict: "whatsapp", ignoreDuplicates: true });

      console.warn(`[ANTI-SPAM] Auto-banned IP ${ip} and WA ${fullWhatsapp}`);
      return NextResponse.json(
        { error: "Aktivitas terdeteksi sebagai spam. Akses diblokir." },
        { status: 403 }
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
    // Sanitize bonusStars — clamp to [0, 10] to prevent manipulation
    const safeBonusStars = sanitizeBonusStars(bonusStars);
    const finalPackageTitle = safeBonusStars > 0
      ? `${sanitizedPackageTitle || ""} (+${safeBonusStars} BONUS ★)`.trim()
      : sanitizedPackageTitle;

    // Validate orderType, paymentMethod, loginMethod against whitelists
    const orderType = String(body.orderType || "paket");
    if (!isValidOrderType(orderType)) {
      return NextResponse.json(
        { error: "Tipe order tidak valid" },
        { status: 400 }
      );
    }
    const paymentMethod = String(body.paymentMethod || "duitku");
    if (!isValidPaymentMethod(paymentMethod)) {
      return NextResponse.json(
        { error: "Metode pembayaran tidak valid" },
        { status: 400 }
      );
    }
    const loginMethod = String(body.loginMethod || "userid");
    if (!isGendong && !isValidLoginMethod(loginMethod)) {
      return NextResponse.json(
        { error: "Metode login tidak valid" },
        { status: 400 }
      );
    }

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

    // supabase client already created above — reuse it

    // ===== SERVER-SIDE PRICE VERIFICATION =====
    let cmsPricing: { perstar?: Record<string, number>; gendong?: Record<string, number>; catalog?: Record<string, number> } | undefined;
    let seasonMultiplier = 1;
    try {
      const { data: pricingSettings } = await supabase
        .from("settings")
        .select("key, value")
        .in("key", ["perstar_pricing", "gendong_pricing", "pricing_catalog", "season_pricing"]);
      if (pricingSettings) {
        cmsPricing = {};
        for (const s of pricingSettings) {
          if (s.key === "perstar_pricing" && Array.isArray(s.value)) {
            cmsPricing.perstar = {};
            for (const r of s.value) { if (r.id && r.price) cmsPricing.perstar[r.id] = r.price; }
          }
          if (s.key === "gendong_pricing" && Array.isArray(s.value)) {
            cmsPricing.gendong = {};
            for (const r of s.value) { if (r.id && r.price) cmsPricing.gendong[r.id] = r.price; }
          }
          if (s.key === "pricing_catalog" && Array.isArray(s.value)) {
            cmsPricing.catalog = {};
            for (const cat of s.value) {
              if (cat.packages && Array.isArray(cat.packages)) {
                for (const pkg of cat.packages) { if (pkg.id && pkg.price) cmsPricing.catalog[pkg.id] = pkg.price; }
              }
            }
          }
          if (s.key === "season_pricing" && s.value?.isEnabled && Array.isArray(s.value.phases)) {
            const now = new Date();
            const sorted = [...s.value.phases]
              .filter((p: { startDate: string }) => p.startDate && new Date(p.startDate) <= now)
              .sort((a: { startDate: string }, b: { startDate: string }) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
            if (sorted.length > 0 && sorted[0].multiplier) {
              seasonMultiplier = sorted[0].multiplier;
            }
          }
        }
      }
    } catch { /* fallback to hardcoded prices */ }

    const serverRawPrice = calculateServerPrice(body, cmsPricing);
    if (serverRawPrice === null) {
      return NextResponse.json(
        { error: "Paket/tipe order tidak valid. Silakan refresh halaman dan coba lagi." },
        { status: 400 }
      );
    }

    let serverBasePrice = serverRawPrice;
    if (seasonMultiplier !== 1) serverBasePrice *= seasonMultiplier;
    if (isExpress) serverBasePrice *= 1.2;
    if (isPremium) serverBasePrice *= 1.3;
    // Apply admin custom discount (admin-only, clamp 0-50% for safety)
    const customDiscountPct = Math.max(0, Math.min(50, Number(body.customDiscount || 0)));
    if (customDiscountPct > 0) serverBasePrice *= (1 - customDiscountPct / 100);
    serverBasePrice = Math.round(serverBasePrice);

    const tolerance = Math.max(serverBasePrice * 0.02, 500);
    if (totalPrice > serverBasePrice + tolerance) {
      console.warn(`Price manipulation: client=${totalPrice}, serverBase=${serverBasePrice}, order=${body.orderType}/${body.packageId || body.perStarRankId}`);
      return NextResponse.json(
        { error: "Harga tidak sesuai. Silakan refresh halaman dan coba lagi." },
        { status: 400 }
      );
    }

    // ===== SERVER-SIDE PROMO/REFERRAL RE-VALIDATION =====
    let verifiedDiscount = 0;
    let verifiedPromoCode: string | null = null;
    let promoId: string | null = null;
    let referrerId: string | null = null;

    if (body.promoCode) {
      const sanitizedPromoCode = String(body.promoCode).replace(/[^a-zA-Z0-9-]/g, "").toUpperCase();

      const { data: promoResult } = await supabase.rpc("validate_promo_code", {
        p_code: sanitizedPromoCode,
        p_order_amount: serverBasePrice,
      });

      if (promoResult && promoResult.length > 0 && promoResult[0].valid) {
        verifiedDiscount = promoResult[0].calculated_discount;
        verifiedPromoCode = sanitizedPromoCode;
        promoId = promoResult[0].promo_id;
      } else {
        const { data: referrer } = await supabase
          .from("customers")
          .select("id, referral_code")
          .eq("referral_code", sanitizedPromoCode)
          .single();

        if (referrer) {
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
            const { data: existingReferral } = await supabase
              .from("referrals")
              .select("id")
              .eq("referrer_id", referrer.id)
              .eq("referred_whatsapp", `+62${cleanWhatsapp}`)
              .limit(1);

            if (!existingReferral || existingReferral.length === 0) {
              verifiedDiscount = Math.round(serverBasePrice * 0.1);
              verifiedPromoCode = sanitizedPromoCode;
              referrerId = referrer.id;
            }
          }
        }
      }
    }

    let verifiedTierDiscount = 0;
    let verifiedTierName: string | null = null;
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
          verifiedTierDiscount = Math.round(serverBasePrice * tierDiscountPct / 100);
          if (verifiedTierDiscount > 0) verifiedTierName = cust.reward_tier;
        }
      } catch { /* not a member or not found */ }
    }

    const verifiedBasePrice = serverBasePrice;
    const verifiedTotalPrice = Math.max(0, serverBasePrice - verifiedDiscount - verifiedTierDiscount);

    if (verifiedTotalPrice < 1000) {
      return NextResponse.json(
        { error: "Harga terlalu rendah setelah diskon" },
        { status: 400 }
      );
    }

    // Insert order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_id: orderId,
        username: sanitizedNickname,
        game_id: sanitizedUserId || "",
        whatsapp: `+62${cleanWhatsapp}`,
        current_rank: normCurrent,
        target_rank: normTarget,
        current_star: body.currentStar ?? null,
        target_star: body.targetStar ?? null,
        package: packageName,
        package_title: finalPackageTitle,
        is_express: !!isExpress,
        is_premium: !!isPremium,
        base_price: verifiedBasePrice,
        total_price: verifiedTotalPrice,
        status: "pending",
        account_login: encryptedLogin,
        account_password: encryptedPassword,
        hero_request: sanitizedHero,
        notes: sanitizedNotes,
        login_method: isGendong ? null : loginMethod,
        customer_email: sanitizedEmail,
        promo_code: verifiedPromoCode,
        promo_discount: verifiedDiscount,
        tier_discount: verifiedTierDiscount,
        tier_name: verifiedTierName,
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
        utm_content: utmContent,
        utm_term: utmTerm,
        fbclid,
        gclid,
        ttclid,
        referrer_url: referrerUrl,
        payment_method: paymentMethod,
        customer_ip: ip,
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

    if (promoId) {
      const { data: promoUsed, error: rpcErr } = await supabase.rpc("try_use_promo_code", { p_promo_id: promoId });
      if (rpcErr) {
        console.error("Failed to use promo code:", rpcErr);
      }
      if (!promoUsed) {
        const correctedPrice = Math.max(1000, verifiedBasePrice - verifiedTierDiscount);
        await supabase.from("orders").update({
          promo_code: null,
          promo_discount: 0,
          total_price: correctedPrice,
        }).eq("id", order.id);
        Object.assign(order, { total_price: correctedPrice });
      }
    }

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

    // Create Duitku payment (only for auto/duitku payment method)
    let paymentUrl: string | undefined;
    const isManualTransfer = paymentMethod === "manual_transfer";

    if (!isManualTransfer) {
      const duitkuConfig = await getDuitkuConfig(supabase);

      if (duitkuConfig.merchantCode && duitkuConfig.apiKey) {
        const merchantOrderId = `ETN-${orderId}-${Date.now()}`;
        try {
          const checkout = await createDuitkuCheckout(duitkuConfig, {
            amount: verifiedTotalPrice,
            merchantOrderId,
            productDetails: `Joki ML: ${finalPackageTitle || packageName} (${normCurrent} → ${normTarget})`,
            email: sanitizedEmail || `customer+${orderId}@etnyx.com`,
            phoneNumber: `+62${cleanWhatsapp}`,
            returnUrl: `${SITE_URL}/payment/success?order_id=${orderId}`,
            callbackUrl: `${SITE_URL}/api/payment/callback`,
            expiryDuration: 1440, // 24h in minutes
            itemDetails: [
              { name: `Joki ${finalPackageTitle || packageName}`, qty: 1, price: verifiedTotalPrice },
            ],
          });

          paymentUrl = checkout.paymentUrl;

          const { error: payUpdateError } = await supabase
            .from("orders")
            .update({
              payment_token: checkout.reference,
              payment_url: paymentUrl,
              midtrans_order_id: merchantOrderId,
              payment_type: "duitku_checkout",
              gateway_provider: "duitku",
            })
            .eq("id", order.id);

          if (payUpdateError) {
            console.error("[Duitku] order update failed:", payUpdateError.message);
          }
        } catch (e) {
          // Duitku API error / timeout. NEVER delete the order —
          // it stays saved and falls back to manual transfer
          // (same data-loss-prevention policy as the old DompetX flow).
          const isTimeout = e instanceof Error && e.name === "AbortError";
          console.error("[Duitku] checkout creation error:", isTimeout ? "(timeout)" : "", e);

          await supabase
            .from("orders")
            .update({
              midtrans_order_id: merchantOrderId,
              payment_type: "duitku_error",
            })
            .eq("id", order.id);

          return NextResponse.json({
            success: true,
            orderId: order.order_id,
            totalPrice: verifiedTotalPrice,
            discount: verifiedDiscount,
            paymentUrl: undefined,
            paymentMethod: "manual_transfer",
            message: "Pembayaran otomatis sedang bermasalah. Order Anda tetap tersimpan — silakan transfer manual.",
          }, { status: 201 });
        }
      } else {
        // No Duitku credentials configured — order behaves as manual transfer
        console.warn("[Duitku] credentials not configured; order falls back to manual transfer");
      }
    }

    await supabase.from("order_logs").insert({
      order_id: order.id,
      action: "created",
      new_value: "pending",
      notes: `Order created via website. ${isManualTransfer ? "Manual transfer." : "Payment link generated via Duitku."}`,
      created_by: "system",
    });

    try {
      const { sendOrderConfirmationWA, notifyAdminNewOrder } = await import("@/lib/notifications");
      await Promise.allSettled([
        sendOrderConfirmationWA({
          order_id: order.order_id,
          username: sanitizedNickname,
          current_rank: normCurrent,
          target_rank: normTarget,
          current_star: body.currentStar ?? null,
          target_star: body.targetStar ?? null,
          package: packageName,
          package_title: finalPackageTitle,
          price: verifiedTotalPrice,
          whatsapp: `+62${cleanWhatsapp}`,
          email: sanitizedEmail || undefined,
          status: "pending",
          payment_url: paymentUrl,
        }),
        notifyAdminNewOrder({
          order_id: order.order_id,
          username: sanitizedNickname,
          current_rank: normCurrent,
          target_rank: normTarget,
          current_star: body.currentStar ?? null,
          target_star: body.targetStar ?? null,
          package: packageName,
          package_title: finalPackageTitle,
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
        paymentMethod: isManualTransfer ? "manual_transfer" : "duitku",
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