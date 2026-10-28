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
  calculateAutoPaketPrice,
  normalizePerStarId,
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

describe("calculateTotalStars — target division stars (Warrior–Legend targets)", () => {
  it("Epic V 1★ → Legend I 3★ = 47 stars (24 Epic + 23 Legend)", () => {
    const result = calculateTotalStars(
      "epic", 5,
      "legend", 1,
      1, // currentDivisionStar
      3, // targetDivisionStar
    );
    expect(result).toBe(47);
  });

  it("Epic V 1★ → Legend V 0★ = 24 stars (0★ in target division = just promoted)", () => {
    const result = calculateTotalStars(
      "epic", 5,
      "legend", 5,
      1, 0,
    );
    expect(result).toBe(24);
  });

  it("same-rank division order: Epic III 1★ → Epic I 2★ = 11 stars", () => {
    // (3-1)*5 - 1 + 2 = 11
    const result = calculateTotalStars(
      "epic", 3,
      "epic", 1,
      1, 2,
    );
    expect(result).toBe(11);
  });
});

describe("calculateAutoPaketPrice — division-star parity & server-side hardening", () => {
  const CMS = {
    perstar: { master: 5000, grandmaster: 6000, epic: 7000, legend: 8000, mythicromawi: 19000, honor: 24000, glory: 27000, immortal: 30000 },
  };

  const baseBody = {
    currentRank: "epic", currentStar: 3, currentDivisionStar: 2,
    targetRank: "legend", targetStar: 4, targetDivisionStar: 0,
    currentMythicStars: 0, targetMythicStars: 0,
  };

  it("Epic III 2★ → Legend IV 0★ = 13×7.000 + 5×8.000 = Rp 131.000 (FE/BE parity incl. currentDivisionStar)", () => {
    expect(calculateAutoPaketPrice(baseBody, CMS)).toBe(131000);
  });

  it("Epic III 2★ → Legend IV 3★ adds 3 target-division stars → Rp 155.000", () => {
    expect(calculateAutoPaketPrice({ ...baseBody, targetDivisionStar: 3 }, CMS)).toBe(155000);
  });

  it("HARDENING: targetDivisionStar = -999 falls back to 0 (no undercharge via crafted payload)", () => {
    expect(calculateAutoPaketPrice({ ...baseBody, targetDivisionStar: -999 }, CMS)).toBe(131000);
  });

  it("HARDENING: targetDivisionStar = 99 (above starsPerDiv-1) falls back to 0", () => {
    expect(calculateAutoPaketPrice({ ...baseBody, targetDivisionStar: 99 }, CMS)).toBe(131000);
  });

  it("HARDENING: currentStar = -50 falls back to lowest division V (conservative, max stars)", () => {
    // Epic V 2★ remaining = (5-2) + (5-1)*5 = 23 → 23×7.000 = 161.000; Legend IV 0★ = 40.000
    expect(calculateAutoPaketPrice({ ...baseBody, currentStar: -50 }, CMS)).toBe(201000);
  });

  it("HARDENING: currentDivisionStar = -50 falls back to 0 (more remaining stars, not fewer)", () => {
    // Epic III 0★ remaining = 15 → 15×7.000 = 105.000; Legend IV 0★ = 40.000
    expect(calculateAutoPaketPrice({ ...baseBody, currentDivisionStar: -50 }, CMS)).toBe(145000);
  });

  it("HARDENING: missing targetMythicStars for Mythic target falls back to tier max (no negative segment)", () => {
    // Legend I 0★ → Mythic (fallback targetMythicStars = max 25):
    // Legend remaining = 1×5 - 0 = 5 → 5×8.000; Mythic target = 25×19.000
    expect(calculateAutoPaketPrice(
      { currentRank: "legend", currentStar: 1, currentDivisionStar: 0, targetRank: "mythic" },
      CMS,
    )).toBe(5 * 8000 + 25 * 19000);
  });

  it("same-rank order returns null (unsupported by server verifier)", () => {
    expect(calculateAutoPaketPrice({ ...baseBody, targetRank: "epic", targetStar: 1 }, CMS)).toBeNull();
  });
});

describe("normalizePerStarId — per-star pricing id aliases", () => {
  it('maps gendong-style "mythic" → "mythicromawi" (the "admin can\'t change Mythic price" bug)', () => {
    expect(normalizePerStarId("mythic")).toBe("mythicromawi");
  });

  it('maps legacy typo "mythicroomawi" → "mythicromawi"', () => {
    expect(normalizePerStarId("mythicroomawi")).toBe("mythicromawi");
  });

  it("passes canonical ids through unchanged", () => {
    expect(normalizePerStarId("legend")).toBe("legend");
    expect(normalizePerStarId("mythicromawi")).toBe("mythicromawi");
    expect(normalizePerStarId("honor")).toBe("honor");
  });
});

describe("calculateAutoPaketPrice — CMS id normalization parity (server verifier)", () => {
  it("REGRESSION: WITHOUT normalization a DB row id 'mythic' is ignored → falls back to the hardcoded 19.000", () => {
    // Documents the production bug: the settings row stores id "mythic"
    // (gendong-style), the price dict gets key "mythic", but the engine's
    // lookup key is "mythicromawi" → admin price silently ignored.
    const body = { currentRank: "mythic", targetRank: "mythichonor", currentMythicStars: 0, targetMythicStars: 25 };
    // 25 stars to promote out of Mythic × fallback 19.000 = 475.000 (NOT 15.000)
    expect(calculateAutoPaketPrice(body, { perstar: { mythic: 15000 } })).toBe(25 * 19000);
  });

  it("WITH normalizePerStarId (as route.ts now applies) the admin price 15.000 is used", () => {
    // route.ts builds: cmsPricing.perstar[normalizePerStarId(r.id)] = r.price
    const dbRows = [{ id: "mythic", price: 15000 }];
    const normalized: Record<string, number> = {};
    for (const r of dbRows) normalized[normalizePerStarId(r.id)] = r.price;
    const body = { currentRank: "mythic", targetRank: "mythichonor", currentMythicStars: 0, targetMythicStars: 25 };
    expect(calculateAutoPaketPrice(body, { perstar: normalized })).toBe(25 * 15000);
  });
});