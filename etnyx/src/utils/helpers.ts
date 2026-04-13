import { RankTier } from "@/types";
import { WHATSAPP_NUMBER } from "@/lib/constants";

// Price calculation map (aligned with PACKAGE_CATALOG)
const priceMap: Record<string, number> = {
  "warrior-elite": 15000,
  "warrior-master": 35000,
  "warrior-grandmaster": 60000,
  "warrior-epic": 185000,
  "warrior-legend": 360000,
  "warrior-mythic": 560000,
  "warrior-mythicglory": 980000,
  "warrior-mythicimmortal": 1500000,
  "elite-master": 20000,
  "elite-grandmaster": 45000,
  "elite-epic": 170000,
  "elite-legend": 345000,
  "elite-mythic": 545000,
  "elite-mythicglory": 965000,
  "elite-mythicimmortal": 1485000,
  "master-grandmaster": 25000,
  "master-epic": 150000,
  "master-legend": 325000,
  "master-mythic": 525000,
  "master-mythicglory": 945000,
  "master-mythicimmortal": 1465000,
  "grandmaster-epic": 125000,
  "grandmaster-legend": 312589,
  "grandmaster-mythic": 425089,
  "grandmaster-mythicglory": 845000,
  "grandmaster-mythicimmortal": 1365000,
  "epic-legend": 175089,
  "epic-mythic": 235089,
  "epic-mythicglory": 655000,
  "epic-mythicimmortal": 1175000,
  "legend-mythic": 200089,
  "legend-mythicglory": 620089,
  "legend-mythicimmortal": 1140000,
  "mythicgrading-mythic": 210089,
  "mythic-mythichonor": 420089,
  "mythic-mythicglory": 420089,
  "mythic-mythicimmortal": 940000,
  "mythichonor-mythicglory": 575089,
  "mythichonor-mythicimmortal": 1095000,
  "mythicglory-mythicimmortal": 520000,
};

// Rank order for validation
const rankOrder: Record<RankTier, number> = {
  warrior: 1,
  elite: 2,
  master: 3,
  grandmaster: 4,
  epic: 5,
  legend: 6,
  mythicgrading: 7,
  mythic: 8,
  mythichonor: 9,
  mythicglory: 10,
  mythicimmortal: 11,
};

export function calculatePrice(
  currentRank: RankTier,
  targetRank: RankTier,
  isExpress: boolean = false,
  isPremium: boolean = false
): number {
  // Validate rank order
  if (rankOrder[targetRank] <= rankOrder[currentRank]) {
    return 0;
  }

  const key = `${currentRank}-${targetRank}`;
  let price = priceMap[key];

  // No fallback - return 0 for unknown combinations
  if (!price) return 0;

  if (isExpress) price *= 1.2;
  if (isPremium) price *= 1.3;

  return Math.round(price);
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function isValidRankProgression(
  current: RankTier,
  target: RankTier
): boolean {
  return rankOrder[target] > rankOrder[current];
}

// Generate random order ID
export function generateOrderId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "ETX-";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Validate WhatsApp number format
export function isValidWhatsAppNumber(number: string): boolean {
  const cleaned = number.replace(/\D/g, "");
  return /^62[0-9]{9,13}$/.test(cleaned);
}

// Create WhatsApp URL with sanitized message
export function createWhatsAppUrl(packageName: string): string {
  const phone = WHATSAPP_NUMBER;
  const sanitizedPackage = packageName.replace(/[<>"'&]/g, "");

  const message = `Halo kak, saya mau order jasa joki ML 🎮

Detail:
• Username: 
• ID: 
• Rank sekarang: 
• Target rank: 
• Paket: ${sanitizedPackage}

Mohon info harga & estimasi ya 🙏`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
