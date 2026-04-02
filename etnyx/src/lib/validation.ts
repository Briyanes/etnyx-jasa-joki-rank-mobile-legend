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
  "legend", "mythic", "mythical_glory", "mythicglory", "immortal",
  "grading", "honor", "glory"
] as const;

export function isValidRank(rank: string): boolean {
  return (VALID_RANKS as readonly string[]).includes(rank.toLowerCase());
}
