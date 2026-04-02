import { RankTier } from "@/types";

// Price calculation map
const priceMap: Record<string, number> = {
  "warrior-elite": 15000,
  "warrior-master": 25000,
  "warrior-grandmaster": 40000,
  "warrior-epic": 60000,
  "warrior-legend": 100000,
  "warrior-mythic": 180000,
  "warrior-mythicglory": 350000,
  "elite-master": 15000,
  "elite-grandmaster": 30000,
  "elite-epic": 50000,
  "elite-legend": 90000,
  "elite-mythic": 170000,
  "elite-mythicglory": 340000,
  "master-grandmaster": 20000,
  "master-epic": 40000,
  "master-legend": 80000,
  "master-mythic": 160000,
  "master-mythicglory": 330000,
  "grandmaster-epic": 25000,
  "grandmaster-legend": 65000,
  "grandmaster-mythic": 145000,
  "grandmaster-mythicglory": 315000,
  "epic-legend": 25000,
  "epic-mythic": 120000,
  "epic-mythicglory": 290000,
  "legend-mythic": 80000,
  "legend-mythicglory": 250000,
  "mythic-mythicglory": 200000,
};

// Rank order for validation
const rankOrder: Record<RankTier, number> = {
  warrior: 1,
  elite: 2,
  master: 3,
  grandmaster: 4,
  epic: 5,
  legend: 6,
  mythic: 7,
  mythicglory: 8,
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
  let price = priceMap[key] || 150000;

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

// Sanitize user input to prevent XSS - basic sanitization that works on both server and client
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>'"&]/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+=/gi, "")
    .trim()
    .substring(0, 100);
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
  const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "6281234567890";
  const sanitizedPackage = sanitizeInput(packageName);

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
