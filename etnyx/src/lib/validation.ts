import sanitizeHtml from "sanitize-html";

export function sanitizeInput(input: string): string {
  return sanitizeHtml(input, {
    allowedTags: [],
    allowedAttributes: {},
  }).trim();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPhone(phone: string): boolean {
  return /^[0-9+\-\s()]{8,20}$/.test(phone);
}

export function isValidUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

const VALID_ORDER_STATUSES = [
  "pending", "confirmed", "in_progress", "completed", "cancelled"
] as const;

export function isValidOrderStatus(status: string): boolean {
  return (VALID_ORDER_STATUSES as readonly string[]).includes(status);
}

const VALID_RANKS = [
  "warrior", "elite", "master", "grandmaster", "epic", 
  "legend", "mythicgrading", "mythic", "mythichonor", "mythicglory", "mythicimmortal",
  // Aliases accepted from frontend
  "mythical_glory",
  // Per-star short IDs (used in perstar/gendong order mode)
  "grading", "honor", "glory", "immortal",
] as const;

export function isValidRank(rank: string): boolean {
  return (VALID_RANKS as readonly string[]).includes(rank.toLowerCase());
}

// ===== Order-specific validation helpers =====

/** Max bonus stars allowed from client (prevents manipulation) */
export const MAX_BONUS_STARS = 10;

/** Clamp bonusStars to safe range [0, MAX_BONUS_STARS] */
export function sanitizeBonusStars(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(Math.floor(n), MAX_BONUS_STARS);
}

/** Max star value for division-based ranks (warrior..legend) */
const DIVISION_RANK_MAX_STARS: Record<string, number> = {
  warrior: 3,      // 3 divisions × 3 stars
  elite: 4,        // divisions × stars
  master: 4,
  grandmaster: 5,
  epic: 5,
  legend: 5,
};

/** Max mythic star values per tier */
const MYTHIC_MAX_STARS: Record<string, number> = {
  mythic: 24,            // 0–24 before Honor
  mythicgrading: 24,
  mythichonor: 49,       // 25–49
  mythicglory: 99,       // 50–99
  mythicimmortal: 999,   // 100+
};

/** Validate division number (1-based) for division-based ranks */
export function isValidDivision(rank: string, div: number): boolean {
  const max = DIVISION_RANK_MAX_STARS[rank.toLowerCase()];
  if (max == null) return false; // Not a division rank
  return div >= 1 && div <= max;
}

/** Validate mythic star count for mythic-tier ranks */
export function isValidMythicStars(rank: string, stars: number): boolean {
  const max = MYTHIC_MAX_STARS[rank.toLowerCase()];
  if (max == null) return false;
  return stars >= 0 && stars <= max;
}

/** Sanitize an integer star value, clamping to [min, max] */
export function clampStars(value: unknown, min: number, max: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(Math.floor(n), max));
}

/** Validate orderType against known types */
const VALID_ORDER_TYPES = ["paket", "perstar", "gendong", "classic"] as const;
export function isValidOrderType(type: string): boolean {
  return (VALID_ORDER_TYPES as readonly string[]).includes(type);
}

/** Validate payment method against known methods */
const VALID_PAYMENT_METHODS = ["dompetx", "manual_transfer"] as const;
export function isValidPaymentMethod(method: string): boolean {
  return (VALID_PAYMENT_METHODS as readonly string[]).includes(method);
}

/** Validate login method against known methods */
const VALID_LOGIN_METHODS = ["moonton", "google", "facebook", "vk", "tiktok", "userid"] as const;
export function isValidLoginMethod(method: string): boolean {
  return (VALID_LOGIN_METHODS as readonly string[]).includes(method.toLowerCase());
}
