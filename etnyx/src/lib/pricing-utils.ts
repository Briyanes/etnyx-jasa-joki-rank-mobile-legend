/**
 * PRICING UTILS — UI-facing re-export layer
 * =========================================
 *
 * All rank configs, star math, and price calculations now live in
 * `pricing-engine.ts` (single source of truth). This file re-exports them
 * for backward compatibility and adds UI-only helpers (formatRupiah,
 * buildWhatsAppMessage).
 *
 * DO NOT add pricing logic here — put it in pricing-engine.ts instead.
 */

// Re-export everything from the pricing engine (single source of truth)
export {
  RANK_LIST,
  RANK_ORDER,
  RANKS_WITH_STARS,
  RANK_DIVISION_CONFIG,
  MYTHIC_STAR_CONFIG,
  rankIcons,
  MYTHIC_PER_STAR_PRICES,
  DEFAULT_PER_STAR_RANKS,
  DEFAULT_GENDONG_RANKS,
  DEFAULT_CATALOG,
  getDivisionOptions,
  getRankDivisionOptions,
  calculateTotalStars,
  findBestPackage,
  calculateExtraMythicCost,
  calculateAutoPaketPrice,
  calculateServerPrice,
  RANK_TO_PRICE_KEY,
  getSafePriceForKey,
  parseClassicRank,
  calculateStarBreakdown,
  type CMSPricing,
  type PackageCategory,
  type ProductPackage,
  type PerStarRank,
  type StarBreakdownSegment,
} from "./pricing-engine";

// ===== UI-only helpers (not needed by backend) =====

/** Format currency as Indonesian Rupiah */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Build a WhatsApp-ready message for a calculated order */
export function buildWhatsAppMessage(params: {
  currentRankLabel: string;
  targetRankLabel: string;
  totalStars: number;
  price: number;
  orderType: "paket" | "perstar" | "gendong" | "classic";
  express?: boolean;
  premium?: boolean;
}): string {
  const { currentRankLabel, targetRankLabel, totalStars, price, orderType, express, premium } = params;
  const typeLabel =
    orderType === "paket" ? "Joki Paket" : orderType === "perstar" ? "Joki Per Bintang" : "Joki Gendong";

  const addons: string[] = [];
  if (express) addons.push("Express (+20%)");
  if (premium) addons.push("Premium Pilot (+30%)");

  const lines = [
    `Halo Kak ETNYX, saya mau order ${typeLabel}`,
    ``,
    `Detail Order:`,
    `Rank Awal: ${currentRankLabel}`,
    `Rank Tujuan: ${targetRankLabel}`,
    `Total Bintang: ${totalStars}`,
    ...(addons.length > 0 ? [`Add-on: ${addons.join(", ")}`] : []),
    ``,
    `Total Harga: ${formatRupiah(price)}`,
    ``,
    `Mohon info lanjutan ya Kak 🙏`,
  ];

  return lines.join("\n");
}