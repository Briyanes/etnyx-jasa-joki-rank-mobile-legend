import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { sanitizeInput, isValidRank, isValidPhone } from "@/lib/validation";
import { encryptField, decryptField } from "@/lib/encryption";
import crypto from "crypto";

// Re-export for backward compatibility
export { decryptField } from "@/lib/encryption";

const DOMPETX_API_KEY = process.env.DOMPETX_API_KEY || "";
const DOMPETX_BASE_URL = process.env.DOMPETX_BASE_URL || "https://api.dompetx.com/v1";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://etnyx.com");

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

// Server-side pricing for per-star and gendong modes (must match frontend)
const SERVER_PER_STAR_PRICES: Record<string, number> = {
  grandmaster: 5000, epic: 6500, legend: 7500, grading: 20000,
  mythic: 18000, honor: 21000, glory: 26000, immortal: 31000,
};
const SERVER_GENDONG_PRICES: Record<string, number> = {
  grandmaster: 9000, epic: 10000, legend: 11000, grading: 23000,
  mythic: 21000, honor: 25000, glory: 30000, immortal: 35000,
};

// Known package prices (id → price) for paket mode validation
const SERVER_PACKAGE_PRICES: Record<string, number> = {
  "rush5-epic": 32000, "rush5-legend": 37000, "rush9-epic": 58000, "rush9-legend": 68000,
  "rush5-mythic": 95000, "rush5-honor": 105000, "rush5-glory": 130000,
  "rush9-mythic": 171000, "rush9-honor": 189000, "rush9-glory": 234000,
  "warrior3-elite3": 25089, "warrior3-master4": 70089, "warrior3-gm5": 149089,
  "warrior3-epic5": 282089, "warrior3-legend5": 459089,
  "warrior1-mythic": 645089, "warrior2-mythic": 653089, "warrior3-mythic": 660089,
  "elite3-master4": 45089, "elite3-gm5": 123089, "elite3-epic5": 259089,
  "elite3-legend5": 435089, "elite1-mythic": 605089, "elite2-mythic": 620089, "elite3-mythic": 635089,
  "master4-gm5": 78089, "master4-epic5": 213089, "master4-legend5": 389089,
  "master1-mythic": 533089, "master2-mythic": 550089, "master3-mythic": 570089, "master4-mythic": 590089,
  "gm5-epic5": 113089, "gm5-legend5": 259089,
  "gm1-mythic": 338089, "gm2-mythic": 360089, "gm3-mythic": 383089,
  "gm4-mythic": 405089, "gm5-mythic": 428089,
  "gm1-honor": 511089, "gm2-honor": 533089, "gm3-honor": 556089, "gm4-honor": 578089, "gm5-honor": 601089,
  "gm1-glory": 983089, "gm2-glory": 1006089, "gm3-glory": 1028089, "gm4-glory": 1051089, "gm5-glory": 1073089,
  "gm1-immortal": 2153089, "gm2-immortal": 2176089, "gm3-immortal": 2198089, "gm4-immortal": 2221089, "gm5-immortal": 2243089,
  "epic5-legend5": 146089, "epic1-mythic": 198089, "epic2-mythic": 227089,
  "epic3-mythic": 257089, "epic4-mythic": 286089, "epic5-mythic": 315089,
  "epic1-honor": 371089, "epic2-honor": 401089, "epic3-honor": 430089, "epic4-honor": 459089, "epic5-honor": 488089,
  "epic1-glory": 844089, "epic2-glory": 873089, "epic3-glory": 902089, "epic4-glory": 932089, "epic5-glory": 961089,
  "epic1-immortal": 2014089, "epic2-immortal": 2043089, "epic3-immortal": 2072089, "epic4-immortal": 2102089, "epic5-immortal": 2131089,
  "legend1-mythic": 34089, "legend2-mythic": 68089, "legend3-mythic": 101089,
  "legend4-mythic": 135089, "legend5-mythic": 169089,
  "legend1-honor": 376089, "legend2-honor": 410089, "legend3-honor": 443089, "legend4-honor": 477089, "legend5-honor": 511089,
  "legend1-glory": 848089, "legend2-glory": 882089, "legend3-glory": 916089, "legend4-glory": 950089, "legend5-glory": 983089,
  "legend1-immortal": 2018089, "legend2-immortal": 2052089, "legend3-immortal": 2086089, "legend4-immortal": 2120089, "legend5-immortal": 2153089,
  "mythic-grading": 180089, "mythic-honor": 342089, "mythic-glory": 815089, "mythic-immortal": 1985089,
  "honor-glory": 473089, "honor-immortal": 1643089,
  "glory-immortal": 1170089,
};

// Server-side auto-calculation for paket mode (mirrors frontend autoCalcPackagePrice)
const RANK_ORDER_SERVER = ["warrior","elite","master","grandmaster","epic","legend","mythicgrading","mythic","mythichonor","mythicglory","mythicimmortal"];
const RANKS_WITH_STARS_SERVER = ["warrior","elite","master","grandmaster","epic","legend"];
const RANK_DIVISION_CONFIG_SERVER: Record<string, { divisions: number; starsPerDiv: number }> = {
  warrior: { divisions: 3, starsPerDiv: 3 },
  elite: { divisions: 3, starsPerDiv: 4 },
  master: { divisions: 4, starsPerDiv: 4 },
  grandmaster: { divisions: 5, starsPerDiv: 5 },
  epic: { divisions: 5, starsPerDiv: 5 },
  legend: { divisions: 5, starsPerDiv: 5 },
};
const MYTHIC_STAR_CONFIG_SERVER: Record<string, { min: number; max: number }> = {
  mythicgrading: { min: 0, max: 10 },
  mythic: { min: 0, max: 25 },
  mythichonor: { min: 25, max: 49 },
  mythicglory: { min: 50, max: 99 },
  mythicimmortal: { min: 100, max: 999 },
};
const RANK_TO_PRICE_KEY: Record<string, string> = {
  warrior: "grandmaster", elite: "grandmaster", master: "grandmaster",
  grandmaster: "grandmaster", epic: "epic", legend: "legend",
  mythicgrading: "grading", mythic: "mythic", mythichonor: "honor",
  mythicglory: "glory", mythicimmortal: "immortal",
};

function calculateAutoPaketPriceServer(
  body: Record<string, unknown>,
  cmsPricing?: { perstar?: Record<string, number>; gendong?: Record<string, number>; catalog?: Record<string, number> }
): number | null {
  const currentRank = String(body.currentRank || "").toLowerCase();
  const targetRank = String(body.targetRank || "").toLowerCase();
  const currentDiv = Number(body.currentStar || 5);
  const targetDiv = Number(body.targetStar || 5);

  const ci = RANK_ORDER_SERVER.indexOf(currentRank);
  const ti = RANK_ORDER_SERVER.indexOf(targetRank);
  if (ci < 0 || ti < 0 || ci >= ti) return null;

  const getPricePerStar = (rank: string): number => {
    const key = RANK_TO_PRICE_KEY[rank] || "grandmaster";
    return cmsPricing?.perstar?.[key] ?? SERVER_PER_STAR_PRICES[key] ?? 5000;
  };

  let originalTotal = 0;

  // Segment 1: current rank remaining stars
  if (RANKS_WITH_STARS_SERVER.includes(currentRank)) {
    const cfg = RANK_DIVISION_CONFIG_SERVER[currentRank];
    if (cfg) {
      const starsInThisRank = currentDiv * cfg.starsPerDiv;
      originalTotal += getPricePerStar(currentRank) * starsInThisRank;
    }
  }

  // Segments in between
  for (let i = ci + 1; i < ti; i++) {
    const rank = RANK_ORDER_SERVER[i];
    if (RANKS_WITH_STARS_SERVER.includes(rank)) {
      const cfg = RANK_DIVISION_CONFIG_SERVER[rank];
      if (cfg) originalTotal += getPricePerStar(rank) * (cfg.divisions * cfg.starsPerDiv);
    } else {
      const mCfg = MYTHIC_STAR_CONFIG_SERVER[rank];
      if (mCfg) originalTotal += getPricePerStar(rank) * (mCfg.max - mCfg.min);
    }
  }

  // Segment last: target rank stars needed
  if (RANKS_WITH_STARS_SERVER.includes(targetRank)) {
    const cfg = RANK_DIVISION_CONFIG_SERVER[targetRank];
    if (cfg) {
      const starsInThisRank = (cfg.divisions - targetDiv) * cfg.starsPerDiv;
      originalTotal += getPricePerStar(targetRank) * starsInThisRank;
    }
  } else {
    const mCfg = MYTHIC_STAR_CONFIG_SERVER[targetRank];
    if (mCfg) originalTotal += getPricePerStar(targetRank) * (mCfg.max - mCfg.min);
  }

  // Bundle discount: 10% cheaper than per-star
  const BUNDLE_DISCOUNT = 0.10;
  return Math.round(originalTotal * (1 - BUNDLE_DISCOUNT));
}

function calculateServerPrice(body: Record<string, unknown>, cmsPricing?: { perstar?: Record<string, number>; gendong?: Record<string, number>; catalog?: Record<string, number> }): number | null {
  const orderType = String(body.orderType || "");
  const isGendong = orderType === "gendong";

  if (orderType === "perstar" || isGendong) {
    const rankId = String(body.perStarRankId || body.currentRank || "").toLowerCase();
    const starQty = Number(body.starQuantity || 0);
    const hardcoded = isGendong ? SERVER_GENDONG_PRICES : SERVER_PER_STAR_PRICES;
    const cmsMap = isGendong ? cmsPricing?.gendong : cmsPricing?.perstar;
    const pricePerStar = cmsMap?.[rankId] ?? hardcoded[rankId];
    if (!pricePerStar || starQty < 1 || starQty > 100) return null;
    return pricePerStar * starQty;
  }

  if (orderType === "paket") {
    const packageId = String(body.packageId || "");

    // Auto-calculated packages (new flow): packageId starts with "auto-"
    // Calculate price server-side from currentRank/targetRank + per-star rates
    if (packageId.startsWith("auto-")) {
      return calculateAutoPaketPriceServer(body, cmsPricing);
    }

    // Legacy: static catalog lookup
    const price = cmsPricing?.catalog?.[packageId] ?? SERVER_PACKAGE_PRICES[packageId];
    return price ?? null;
  }

  return null;
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
        payment_method: body.paymentMethod === "manual_transfer" ? "manual_transfer" : "dompetx",
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

    // Create DompetX payment (only for auto/dompetx payment method)
    let paymentUrl: string | undefined;
    const isManualTransfer = body.paymentMethod === "manual_transfer";

    if (!isManualTransfer) {
      let dompetxApiKey = DOMPETX_API_KEY;
      let dompetxBaseUrl = DOMPETX_BASE_URL;
      try {
        const { data: intSettings } = await supabase
          .from("settings")
          .select("value")
          .eq("key", "integrations")
          .single();
        if (intSettings?.value?.dompetxApiKey) {
          dompetxApiKey = intSettings.value.dompetxApiKey;
        }
        if (intSettings?.value?.dompetxBaseUrl) {
          dompetxBaseUrl = intSettings.value.dompetxBaseUrl;
        }
      } catch { /* fallback to env */ }

      if (dompetxApiKey) {
        const dompetxRefId = `ETN-${orderId}-${Date.now()}`;
        try {
          // Build DompetX checkout payload (POST /payments/checkout format)
          const dompetxCheckoutBody = {
            amount: verifiedTotalPrice,
            currency: "IDR",
            reference: dompetxRefId,
            redirectUrl: `${SITE_URL}/payment/success?order_id=${orderId}`,
            metadata: {
              order_name: `Joki ML ${orderId}`,
              product_name: `Joki ML: ${normCurrent} to ${normTarget}`,
              customer_name: sanitizedNickname,
              customer_email: sanitizedEmail || "",
              notes: "Order akan diproses otomatis setelah pembayaran berhasil.",
              items: [
                {
                  name: `Joki ${sanitizedPackageTitle || packageName}`,
                  quantity: 1,
                  price: verifiedTotalPrice,
                },
              ],
            },
          };

          const dompetxBodyString = JSON.stringify(dompetxCheckoutBody);

          // Build DompetX auth headers (3 required headers)
          const dompetxTimestamp = Math.floor(Date.now() / 1000).toString();
          const dompetxSignature = crypto
            .createHmac("sha256", dompetxApiKey)
            .update(dompetxTimestamp + dompetxBodyString)
            .digest("hex");

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000);

          let dompetxRes: Response;
          try {
            dompetxRes = await fetch(`${dompetxBaseUrl}/payments/checkout`, {
              method: "POST",
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                "X-DOMPAY-API-Key": dompetxApiKey,
                "X-DOMPAY-Signature": dompetxSignature,
                "X-DOMPAY-Timestamp": dompetxTimestamp,
              },
              body: dompetxBodyString,
              signal: controller.signal,
            });
          } finally {
            clearTimeout(timeoutId);
          }

          // Parse response — capture raw text first for debugging
          const dompetxRawText = await dompetxRes.text();
          let dompetxData: Record<string, unknown>;
          try {
            dompetxData = JSON.parse(dompetxRawText);
          } catch {
            dompetxData = { _raw: dompetxRawText };
          }

          // DompetX response may be flat OR nested in `data`.
          // Confirmed fields from real DompetX checkout response:
          //   { id, reference, amount, fee, total_amount, status, ... }
          // The payment URL field name varies across DompetX versions — check ALL known variants.
          const checkoutData =
            (dompetxData.data && typeof dompetxData.data === "object")
              ? (dompetxData.data as Record<string, unknown>)
              : dompetxData;

          // Try every known field name for checkout ID
          const trxId = String(
            checkoutData.id ||
            checkoutData.checkout_id ||
            checkoutData.checkoutId ||
            checkoutData.payment_id ||
            checkoutData.paymentId ||
            checkoutData.transaction_id ||
            checkoutData.transactionId ||
            dompetxData.id ||
            dompetxData.checkout_id ||
            dompetxData.payment_id ||
            ""
          );

          // Try every known field name for payment URL
          const extractedLink = String(
            checkoutData.payment_link ||
            checkoutData.payment_url ||
            checkoutData.paymentLink ||
            checkoutData.paymentUrl ||
            checkoutData.checkout_url ||
            checkoutData.checkoutUrl ||
            checkoutData.redirect_url ||
            checkoutData.redirectUrl ||
            checkoutData.url ||
            checkoutData.link ||
            checkoutData.invoice_url ||
            checkoutData.invoiceUrl ||
            dompetxData.payment_link ||
            dompetxData.payment_url ||
            dompetxData.checkout_url ||
            dompetxData.redirect_url ||
            dompetxData.url ||
            ""
          );

          // CONFIRMED DompetX checkout URL pattern (from production):
          // https://checkout.dompetx.com/checkoutV2?refId={ID}
          // Use this as fallback if API doesn't return a direct link.
          let constructedLink = "";
          if (!extractedLink && trxId && dompetxRes.ok) {
            constructedLink = `https://checkout.dompetx.com/checkoutV2?refId=${trxId}`;
            console.warn("DompetX: constructed checkout URL from ID:", constructedLink, "Raw response:", dompetxRawText.slice(0, 500));
          }

          const finalLink = extractedLink || constructedLink;

          // CASE 1: Success with payment URL
          if (dompetxRes.ok && finalLink) {
            paymentUrl = finalLink;

            await supabase
              .from("orders")
              .update({
                payment_token: trxId || null,
                payment_url: paymentUrl,
                midtrans_order_id: dompetxRefId,
                payment_type: "dompetx_checkout",
              })
              .eq("id", order.id);
          } else if (dompetxRes.ok) {
            // CASE 2: 2xx from DompetX (checkout created — proven by email receipt)
            // but we can't extract a usable URL. NEVER delete the order.
            console.warn("DompetX: 2xx received, checkout likely created, but no usable URL. Checkout ID:", trxId || "(none)", "Raw:", dompetxRawText.slice(0, 500));

            await supabase
              .from("orders")
              .update({
                payment_token: trxId || null,
                midtrans_order_id: dompetxRefId,
                payment_type: "dompetx_checkout_recovery",
              })
              .eq("id", order.id);

            return NextResponse.json({
              success: true,
              orderId: order.order_id,
              totalPrice: verifiedTotalPrice,
              discount: verifiedDiscount,
              paymentUrl: undefined,
              paymentMethod: "manual_transfer",
              message: "Checkout DompetX berhasil dibuat (cek email Anda). Link pembayaran tidak dapat diambil otomatis — silakan transfer manual atau cek email dari DompetX.",
            }, { status: 201 });
          } else {
            // CASE 3: Non-2xx from DompetX — genuine API error
            // BUT still keep the order; fallback to manual transfer.
            // Deleting creates data loss and bad UX since the order was legitimately placed.
            console.error("DompetX API error:", dompetxRes.status, dompetxRawText.slice(0, 500));

            await supabase
              .from("orders")
              .update({
                midtrans_order_id: dompetxRefId,
                payment_type: "dompetx_failed",
              })
              .eq("id", order.id);

            return NextResponse.json({
              success: true,
              orderId: order.order_id,
              totalPrice: verifiedTotalPrice,
              discount: verifiedDiscount,
              paymentUrl: undefined,
              paymentMethod: "manual_transfer",
              message: "Pembayaran otomatis DompetX sedang bermasalah. Order Anda tetap tersimpan — silakan transfer manual.",
            }, { status: 201 });
          }
        } catch (e) {
          // CASE 4: Network error / timeout / fetch exception.
          // The DompetX request MAY have actually succeeded on their server
          // (proven by real cases where the checkout email was received even
          // though this fetch threw). NEVER delete the order — that causes
          // data loss. Instead, keep it and fall back to manual transfer,
          // consistent with CASE 2 and CASE 3.
          const isTimeout = e instanceof Error && e.name === "AbortError";
          console.error("DompetX payment creation error:", isTimeout ? "(timeout)" : "", e);

          await supabase
            .from("orders")
            .update({
              midtrans_order_id: dompetxRefId,
              payment_type: "dompetx_error",
            })
            .eq("id", order.id);

          return NextResponse.json({
            success: true,
            orderId: order.order_id,
            totalPrice: verifiedTotalPrice,
            discount: verifiedDiscount,
            paymentUrl: undefined,
            paymentMethod: "manual_transfer",
            message: isTimeout
              ? "Koneksi ke DompetX timeout. Order Anda tetap tersimpan — silakan transfer manual atau cek email dari DompetX."
              : "Pembayaran otomatis DompetX sedang bermasalah. Order Anda tetap tersimpan — silakan transfer manual atau cek email dari DompetX.",
          }, { status: 201 });
        }
      }
    }

    await supabase.from("order_logs").insert({
      order_id: order.id,
      action: "created",
      new_value: "pending",
      notes: `Order created via website. ${isManualTransfer ? "Manual transfer." : "Payment link generated via DompetX."}`,
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
          package_title: sanitizedPackageTitle,
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
        paymentMethod: isManualTransfer ? "manual_transfer" : "dompetx",
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