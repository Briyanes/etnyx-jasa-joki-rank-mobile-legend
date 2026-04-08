import { describe, it, expect } from "vitest";
import {
  calculatePrice,
  formatRupiah,
  isValidRankProgression,
  generateOrderId,
  isValidWhatsAppNumber,
} from "@/utils/helpers";

describe("formatRupiah", () => {
  it("formats positive amounts", () => {
    const result = formatRupiah(150000);
    expect(result).toContain("150.000");
    expect(result).toContain("Rp");
  });

  it("formats zero", () => {
    const result = formatRupiah(0);
    expect(result).toContain("0");
  });

  it("formats large amounts", () => {
    const result = formatRupiah(1000000);
    expect(result).toContain("1.000.000");
  });
});

describe("calculatePrice", () => {
  it("returns correct base price for known rank pair", () => {
    const price = calculatePrice("warrior", "elite");
    expect(price).toBe(15000);
  });

  it("returns 0 for same rank", () => {
    const price = calculatePrice("warrior", "warrior");
    expect(price).toBe(0);
  });

  it("returns 0 for downgrade", () => {
    const price = calculatePrice("epic", "warrior");
    expect(price).toBe(0);
  });

  it("applies express multiplier (1.2x)", () => {
    const base = calculatePrice("warrior", "elite");
    const express = calculatePrice("warrior", "elite", true);
    expect(express).toBe(Math.round(base * 1.2));
  });

  it("applies premium multiplier (1.3x)", () => {
    const base = calculatePrice("warrior", "elite");
    const premium = calculatePrice("warrior", "elite", false, true);
    expect(premium).toBe(Math.round(base * 1.3));
  });

  it("applies both express + premium", () => {
    const base = calculatePrice("warrior", "elite");
    const both = calculatePrice("warrior", "elite", true, true);
    expect(both).toBe(Math.round(base * 1.2 * 1.3));
  });

  it("handles epic to legend", () => {
    const price = calculatePrice("epic", "legend");
    expect(price).toBe(175089);
  });

  it("returns fallback for unknown pair", () => {
    // mythicgrading to mythicimmortal isn't in the map
    const price = calculatePrice("mythicgrading", "mythicimmortal");
    expect(price).toBe(150000); // fallback
  });
});

describe("isValidRankProgression", () => {
  it("returns true for valid progression", () => {
    expect(isValidRankProgression("warrior", "elite")).toBe(true);
    expect(isValidRankProgression("epic", "mythicglory")).toBe(true);
  });

  it("returns false for same rank", () => {
    expect(isValidRankProgression("warrior", "warrior")).toBe(false);
  });

  it("returns false for downgrade", () => {
    expect(isValidRankProgression("mythic", "warrior")).toBe(false);
  });

  it("validates full rank chain", () => {
    const ranks = ["warrior", "elite", "master", "grandmaster", "epic", "legend", "mythic", "mythicglory", "mythicimmortal"] as const;
    for (let i = 0; i < ranks.length - 1; i++) {
      expect(isValidRankProgression(ranks[i], ranks[i + 1])).toBe(true);
    }
  });
});

describe("generateOrderId", () => {
  it("starts with ETX-", () => {
    const id = generateOrderId();
    expect(id).toMatch(/^ETX-/);
  });

  it("has correct length (ETX- + 8 chars = 12)", () => {
    const id = generateOrderId();
    expect(id).toHaveLength(12);
  });

  it("contains only uppercase alphanumeric after prefix", () => {
    const id = generateOrderId();
    const suffix = id.slice(4);
    expect(suffix).toMatch(/^[A-Z0-9]{8}$/);
  });

  it("generates unique IDs", () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateOrderId()));
    expect(ids.size).toBeGreaterThan(90); // Very unlikely to have many collisions
  });
});

describe("isValidWhatsAppNumber", () => {
  it("accepts valid Indonesian numbers", () => {
    expect(isValidWhatsAppNumber("6281234567890")).toBe(true);
    expect(isValidWhatsAppNumber("628123456789")).toBe(true);
  });

  it("rejects numbers without 62 prefix", () => {
    expect(isValidWhatsAppNumber("081234567890")).toBe(false);
    expect(isValidWhatsAppNumber("1234567890")).toBe(false);
  });

  it("rejects too short numbers", () => {
    expect(isValidWhatsAppNumber("6281234")).toBe(false);
  });

  it("handles numbers with formatting", () => {
    expect(isValidWhatsAppNumber("62-812-3456-7890")).toBe(true);
    expect(isValidWhatsAppNumber("+62 812 3456 7890")).toBe(true);
  });
});
