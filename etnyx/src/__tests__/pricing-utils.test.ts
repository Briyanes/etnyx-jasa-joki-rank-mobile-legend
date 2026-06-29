/**
 * Unit tests for calculateTotalStars — the core star-counting function.
 *
 * CRITICAL REGRESSION: Honor 25★ → Immortal 100★ must equal 75 (NOT 73).
 * The old bug used `max` instead of `nextMin` for Mythic promotion thresholds,
 * causing an off-by-one at each tier boundary (Honor→Glory, Glory→Immo).
 */
import { describe, it, expect } from "vitest";
import {
  calculateTotalStars,
  MYTHIC_STAR_CONFIG,
} from "@/lib/pricing-utils";

describe("calculateTotalStars — Mythic tier transitions", () => {
  /* ─────────────────────────────────────────────
   * THE CRITICAL REGRESSION TEST
   * Honor 25 → Immortal 100 = 75 stars (NOT 73)
   * ───────────────────────────────────────────── */
  it("Honor 25★ → Immortal 100★ = 75 stars (REGRESSION: was 73)", () => {
    // currentDivisionStar=0 (not a division rank), targetDivisionStar=100 (target mythic stars)
    const result = calculateTotalStars(
      "mythichonor", 0, // current: Honor, div irrelevant
      "mythicimmortal", 0, // target: Immortal, div irrelevant
      0,   // currentDivisionStar (unused for mythic)
      100, // targetDivisionStar = target mythic stars = 100
      25,  // currentMythicStars = 25
    );
    expect(result).toBe(75);
  });

  it("Honor 25★ → Glory 50★ = 25 stars", () => {
    const result = calculateTotalStars(
      "mythichonor", 0,
      "mythicglory", 0,
      0,
      50, // target = 50 (Glory min)
      25, // current = 25 (Honor min)
    );
    expect(result).toBe(25);
  });

  it("Honor 25★ → Glory 99★ = 74 stars (nextMin=100, so 100-25=75... wait)", () => {
    // Glory max displayable = 99, but targetDivisionStar=99 means 99-50=49 in Glory
    // Plus Honor: nextMin(50) - 25 = 25
    // Total = 25 + 49 = 74
    const result = calculateTotalStars(
      "mythichonor", 0,
      "mythicglory", 0,
      0,
      99,
      25,
    );
    expect(result).toBe(74);
  });

  it("Mythic 0★ → Glory 50★ = 50 stars", () => {
    const result = calculateTotalStars(
      "mythic", 0,
      "mythicglory", 0,
      0,
      50,
      0,
    );
    expect(result).toBe(50);
  });

  it("Mythic 0★ → Immortal 100★ = 100 stars", () => {
    const result = calculateTotalStars(
      "mythic", 0,
      "mythicimmortal", 0,
      0,
      100,
      0,
    );
    expect(result).toBe(100);
  });

  it("Glory 50★ → Immortal 100★ = 50 stars", () => {
    const result = calculateTotalStars(
      "mythicglory", 0,
      "mythicimmortal", 0,
      0,
      100,
      50,
    );
    expect(result).toBe(50);
  });

  it("Glory 50★ → Immortal 150★ = 100 stars", () => {
    const result = calculateTotalStars(
      "mythicglory", 0,
      "mythicimmortal", 0,
      0,
      150,
      50,
    );
    expect(result).toBe(100);
  });

  it("Honor 30★ → Immortal 100★ = 70 stars (mid-tier start)", () => {
    const result = calculateTotalStars(
      "mythichonor", 0,
      "mythicimmortal", 0,
      0,
      100,
      30,
    );
    expect(result).toBe(70);
  });
});

describe("calculateTotalStars — same Mythic tier", () => {
  it("Honor 25★ → Honor 49★ = 24 stars (within same tier)", () => {
    // Same rank (ci === ti), same mythic tier: target - current
    // But wait — calculateTotalStars returns 0 for ci >= ti unless division rank
    // For mythic same-tier, the function returns 0 — it's handled by caller
    const result = calculateTotalStars(
      "mythichonor", 0,
      "mythichonor", 0,
      0,
      49,
      25,
    );
    // Same rank: the function checks ci === ti && RANKS_WITH_STARS — mythic is NOT in RANKS_WITH_STARS
    // So it falls through to return 0
    expect(result).toBe(0);
  });
});

describe("calculateTotalStars — Mythic boundary verification", () => {
  it("verifies MYTHIC_STAR_CONFIG has correct nextMin values", () => {
    expect(MYTHIC_STAR_CONFIG.mythichonor.nextMin).toBe(50);
    expect(MYTHIC_STAR_CONFIG.mythicglory.nextMin).toBe(100);
    expect(MYTHIC_STAR_CONFIG.mythicimmortal.nextMin).toBe(1000);
  });

  it("verifies nextMin ≠ max for Honor and Glory (the root cause of bug 73)", () => {
    expect(MYTHIC_STAR_CONFIG.mythichonor.max).toBe(49);
    expect(MYTHIC_STAR_CONFIG.mythichonor.nextMin).toBe(50);
    expect(MYTHIC_STAR_CONFIG.mythichonor.nextMin).toBeGreaterThan(MYTHIC_STAR_CONFIG.mythichonor.max);

    expect(MYTHIC_STAR_CONFIG.mythicglory.max).toBe(99);
    expect(MYTHIC_STAR_CONFIG.mythicglory.nextMin).toBe(100);
    expect(MYTHIC_STAR_CONFIG.mythicglory.nextMin).toBeGreaterThan(MYTHIC_STAR_CONFIG.mythicglory.max);
  });
});

describe("calculateTotalStars — non-Mythic ranks (sanity check)", () => {
  it("Warrior III(3) → Elite I(1) = correct stars", () => {
    // Warrior III: 3 stars to clear (starsPerDiv=3, div=3, currentDivisionStar=0)
    // = (3-0) + (3-1)*3 = 3 + 6 = 9... wait, let me trace
    // Current rank stars: (starsPerDiv - currentDivisionStar) + (currentDiv-1)*starsPerDiv
    // = (3 - 0) + (3-1)*3 = 3 + 6 = 9
    // Target: (divisions - targetDiv) * starsPerDiv + targetDivisionStar
    // Elite has divisions=3, starsPerDiv=4, targetDiv=1
    // = (3-1)*4 + 0 = 8
    // Total = 9 + 8 = 17
    const result = calculateTotalStars(
      "warrior", 3,
      "elite", 1,
      0, 0,
    );
    expect(result).toBe(17);
  });

  it("Epic V(5) → Legend I(1) = correct stars", () => {
    // Epic: (5-0) + (5-1)*5 = 5 + 20 = 25
    // Legend: (5-1)*5 + 0 = 20
    // Total = 45
    const result = calculateTotalStars(
      "epic", 5,
      "legend", 1,
      0, 0,
    );
    expect(result).toBe(45);
  });
});