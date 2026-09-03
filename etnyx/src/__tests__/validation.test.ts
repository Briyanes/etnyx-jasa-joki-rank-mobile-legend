/**
 * Unit tests for validation.ts — security-critical input sanitization.
 *
 * Covers:
 * - sanitizeBonusStars (manipulation prevention)
 * - isValidRank, isValidOrderType, isValidPaymentMethod, isValidLoginMethod
 * - isValidDivision, isValidMythicStars
 * - clampStars
 */
import { describe, it, expect } from "vitest";
import {
  sanitizeInput,
  isValidEmail,
  isValidPhone,
  isValidUUID,
  isValidRank,
  isValidOrderStatus,
  sanitizeBonusStars,
  MAX_BONUS_STARS,
  isValidDivision,
  isValidMythicStars,
  clampStars,
  isValidOrderType,
  isValidPaymentMethod,
  isValidLoginMethod,
} from "@/lib/validation";

describe("sanitizeInput", () => {
  it("completely removes script tags and content", () => {
    // sanitize-html removes <script> entirely (content + tag)
    expect(sanitizeInput("<script>alert('xss')</script>")).toBe("");
  });

  it("strips formatting tags but keeps text", () => {
    expect(sanitizeInput("  <b>hello</b>  ")).toBe("hello");
  });

  it("passes through plain text", () => {
    expect(sanitizeInput("PlayerName123")).toBe("PlayerName123");
  });

  it("handles empty string", () => {
    expect(sanitizeInput("")).toBe("");
  });
});

describe("isValidEmail", () => {
  it("accepts valid emails", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
    expect(isValidEmail("test.name+tag@domain.co.id")).toBe(true);
  });

  it("rejects invalid emails", () => {
    expect(isValidEmail("not-an-email")).toBe(false);
    expect(isValidEmail("@domain.com")).toBe(false);
    expect(isValidEmail("user@")).toBe(false);
    expect(isValidEmail("")).toBe(false);
  });
});

describe("isValidPhone", () => {
  it("accepts valid phone numbers", () => {
    expect(isValidPhone("+6281234567890")).toBe(true);
    expect(isValidPhone("0812-3456-7890")).toBe(true);
    expect(isValidPhone("(021) 555-1234")).toBe(true);
  });

  it("rejects too-short or too-long numbers", () => {
    expect(isValidPhone("123")).toBe(false);
    expect(isValidPhone("1".repeat(25))).toBe(false);
  });
});

describe("isValidUUID", () => {
  it("accepts valid UUIDs", () => {
    expect(isValidUUID("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
  });

  it("rejects invalid UUIDs", () => {
    expect(isValidUUID("not-a-uuid")).toBe(false);
    expect(isValidUUID("550e8400")).toBe(false);
  });
});

describe("isValidRank", () => {
  it("accepts standard ranks", () => {
    expect(isValidRank("warrior")).toBe(true);
    expect(isValidRank("mythic")).toBe(true);
    expect(isValidRank("mythicimmortal")).toBe(true);
  });

  it("accepts short aliases", () => {
    expect(isValidRank("honor")).toBe(true);
    expect(isValidRank("glory")).toBe(true);
    expect(isValidRank("immortal")).toBe(true);
    expect(isValidRank("grading")).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(isValidRank("WARRIOR")).toBe(true);
    expect(isValidRank("MythicHonor")).toBe(true);
  });

  it("rejects invalid ranks", () => {
    expect(isValidRank("diamond")).toBe(false);
    expect(isValidRank("")).toBe(false);
    expect(isValidRank("mythictitan")).toBe(false);
  });
});

describe("isValidOrderStatus", () => {
  it("accepts valid statuses", () => {
    expect(isValidOrderStatus("pending")).toBe(true);
    expect(isValidOrderStatus("completed")).toBe(true);
    expect(isValidOrderStatus("cancelled")).toBe(true);
  });

  it("rejects invalid statuses", () => {
    expect(isValidOrderStatus("deleted")).toBe(false);
    expect(isValidOrderStatus("")).toBe(false);
  });
});

// ===== New order-specific validation helpers =====

describe("sanitizeBonusStars", () => {
  it("returns 0 for undefined/null", () => {
    expect(sanitizeBonusStars(undefined)).toBe(0);
    expect(sanitizeBonusStars(null)).toBe(0);
  });

  it("returns 0 for negative values", () => {
    expect(sanitizeBonusStars(-1)).toBe(0);
    expect(sanitizeBonusStars(-999)).toBe(0);
  });

  it("returns 0 for NaN/non-numbers", () => {
    expect(sanitizeBonusStars("abc")).toBe(0);
    expect(sanitizeBonusStars(NaN)).toBe(0);
    expect(sanitizeBonusStars(Infinity)).toBe(0);
  });

  it("passes through valid values within range", () => {
    expect(sanitizeBonusStars(0)).toBe(0);
    expect(sanitizeBonusStars(3)).toBe(3);
    expect(sanitizeBonusStars(5)).toBe(5);
    expect(sanitizeBonusStars(MAX_BONUS_STARS)).toBe(MAX_BONUS_STARS);
  });

  it("clamps to MAX_BONUS_STARS", () => {
    expect(sanitizeBonusStars(MAX_BONUS_STARS + 1)).toBe(MAX_BONUS_STARS);
    expect(sanitizeBonusStars(999)).toBe(MAX_BONUS_STARS);
    expect(sanitizeBonusStars(99999)).toBe(MAX_BONUS_STARS);
  });

  it("floors decimal values", () => {
    expect(sanitizeBonusStars(3.7)).toBe(3);
    expect(sanitizeBonusStars(2.1)).toBe(2);
  });

  it("accepts string numbers", () => {
    expect(sanitizeBonusStars("5")).toBe(5);
    expect(sanitizeBonusStars("3.9")).toBe(3);
  });
});

describe("isValidDivision", () => {
  it("accepts valid divisions for known ranks", () => {
    expect(isValidDivision("warrior", 1)).toBe(true);
    expect(isValidDivision("warrior", 2)).toBe(true);
    expect(isValidDivision("warrior", 3)).toBe(true);
    expect(isValidDivision("epic", 1)).toBe(true);
    expect(isValidDivision("legend", 5)).toBe(true);
  });

  it("rejects out-of-range divisions", () => {
    expect(isValidDivision("warrior", 0)).toBe(false);
    expect(isValidDivision("warrior", 4)).toBe(false);
    expect(isValidDivision("epic", 6)).toBe(false);
  });

  it("returns false for non-division ranks (mythic)", () => {
    expect(isValidDivision("mythic", 1)).toBe(false);
    expect(isValidDivision("mythichonor", 1)).toBe(false);
  });
});

describe("isValidMythicStars", () => {
  it("accepts valid star counts", () => {
    expect(isValidMythicStars("mythic", 0)).toBe(true);
    expect(isValidMythicStars("mythic", 24)).toBe(true);
    expect(isValidMythicStars("mythichonor", 25)).toBe(true);
    expect(isValidMythicStars("mythichonor", 49)).toBe(true);
    expect(isValidMythicStars("mythicglory", 50)).toBe(true);
    expect(isValidMythicStars("mythicglory", 99)).toBe(true);
    expect(isValidMythicStars("mythicimmortal", 100)).toBe(true);
    expect(isValidMythicStars("mythicimmortal", 999)).toBe(true);
  });

  it("rejects out-of-range stars", () => {
    expect(isValidMythicStars("mythic", -1)).toBe(false);
    expect(isValidMythicStars("mythic", 25)).toBe(false); // max is 24
    expect(isValidMythicStars("mythichonor", 50)).toBe(false); // max is 49
    expect(isValidMythicStars("mythicglory", 100)).toBe(false); // max is 99
    expect(isValidMythicStars("mythicimmortal", -1)).toBe(false);
  });

  it("returns false for non-mythic ranks", () => {
    expect(isValidMythicStars("warrior", 0)).toBe(false);
    expect(isValidMythicStars("epic", 5)).toBe(false);
  });
});

describe("clampStars", () => {
  it("returns min for NaN", () => {
    expect(clampStars("abc", 0, 10)).toBe(0);
    expect(clampStars(NaN, 0, 10)).toBe(0);
  });

  it("clamps below min", () => {
    expect(clampStars(-5, 0, 10)).toBe(0);
    expect(clampStars(-999, 0, 10)).toBe(0);
  });

  it("clamps above max", () => {
    expect(clampStars(15, 0, 10)).toBe(10);
    expect(clampStars(999, 0, 10)).toBe(10);
  });

  it("passes through valid values", () => {
    expect(clampStars(5, 0, 10)).toBe(5);
    expect(clampStars(10, 0, 10)).toBe(10);
  });

  it("floors decimals", () => {
    expect(clampStars(3.7, 0, 10)).toBe(3);
  });
});

describe("isValidOrderType", () => {
  it("accepts valid types", () => {
    expect(isValidOrderType("paket")).toBe(true);
    expect(isValidOrderType("perstar")).toBe(true);
    expect(isValidOrderType("gendong")).toBe(true);
    expect(isValidOrderType("classic")).toBe(true);
  });

  it("rejects invalid types", () => {
    expect(isValidOrderType("custom")).toBe(false);
    expect(isValidOrderType("")).toBe(false);
    expect(isValidOrderType("PAKET")).toBe(false); // case-sensitive
  });
});

describe("isValidPaymentMethod", () => {
  it("accepts valid methods", () => {
    expect(isValidPaymentMethod("duitku")).toBe(true);
    expect(isValidPaymentMethod("manual_transfer")).toBe(true);
  });

  it("rejects the retired dompetx gateway", () => {
    expect(isValidPaymentMethod("dompetx")).toBe(false);
  });

  it("rejects invalid methods", () => {
    expect(isValidPaymentMethod("paypal")).toBe(false);
    expect(isValidPaymentMethod("")).toBe(false);
  });
});

describe("isValidLoginMethod", () => {
  it("accepts valid methods (case-insensitive)", () => {
    expect(isValidLoginMethod("moonton")).toBe(true);
    expect(isValidLoginMethod("Google")).toBe(true);
    expect(isValidLoginMethod("FACEBOOK")).toBe(true);
    expect(isValidLoginMethod("vk")).toBe(true);
    expect(isValidLoginMethod("tiktok")).toBe(true);
    expect(isValidLoginMethod("userid")).toBe(true);
  });

  it("rejects invalid methods", () => {
    expect(isValidLoginMethod("apple")).toBe(false);
    expect(isValidLoginMethod("")).toBe(false);
  });
});