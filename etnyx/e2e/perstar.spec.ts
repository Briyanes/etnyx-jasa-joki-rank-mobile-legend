import { test, expect } from "@playwright/test";

test.describe("Order Page — Per Star Mode", () => {
  test.beforeEach(async ({ page }) => {
    // Dismiss TermsPopup by setting localStorage flag before navigation
    await page.addInitScript(() => {
      localStorage.setItem("etnyx_terms_seen", "true");
    });

    await page.goto("/order?mode=perstar");
    // Wait for perstar mode to fully render
    await expect(
      page.locator("text=Pilih rank awal & rank tujuan untuk melihat harga")
    ).toBeVisible({ timeout: 15000 });
  });

  test("should show empty state placeholder when no ranks selected", async ({ page }) => {
    await expect(page.locator("text=Estimasi Harga Per Bintang")).not.toBeVisible();
    const nextBtn = page.locator("button:has-text('Lanjut')");
    await expect(nextBtn).toBeDisabled();
  });

  test("should have empty current rank dropdown and disabled target", async ({ page }) => {
    const currentRankSelect = page.locator("[data-testid='perstar-current-rank']");
    await expect(currentRankSelect).toBeVisible({ timeout: 5000 });
    await expect(currentRankSelect).toHaveValue("");

    const targetRankSelect = page.locator("[data-testid='perstar-target-rank']");
    await expect(targetRankSelect).toBeVisible({ timeout: 5000 });
    await expect(targetRankSelect).toBeDisabled();
  });

  test("should enable target and show price after selecting both ranks", async ({ page }) => {
    const currentRankSelect = page.locator("[data-testid='perstar-current-rank']");
    const targetRankSelect = page.locator("[data-testid='perstar-target-rank']");

    // Select current rank — use React-compatible native setter
    await currentRankSelect.evaluate((el) => {
      const select = el as HTMLSelectElement;
      const nativeSetter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value")?.set;
      nativeSetter?.call(select, "epic");
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await page.waitForTimeout(500);

    // Target dropdown should become enabled
    await expect(targetRankSelect).toBeEnabled({ timeout: 5000 });

    // Select target rank — use React-compatible native setter
    await targetRankSelect.evaluate((el) => {
      const select = el as HTMLSelectElement;
      const nativeSetter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value")?.set;
      nativeSetter?.call(select, "mythic");
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await page.waitForTimeout(500);

    // Calculator price card should appear
    await expect(page.locator("text=Estimasi Harga Per Bintang")).toBeVisible({ timeout: 5000 });

    // "Lanjut" button should be enabled
    const nextBtn = page.locator("button:has-text('Lanjut')");
    await expect(nextBtn).toBeEnabled({ timeout: 5000 });
  });

  test("should show Daftar Harga price list", async ({ page }) => {
    await expect(page.locator("text=Daftar Harga").first()).toBeVisible({ timeout: 5000 });
  });

  // Helper: set a <select> value via React-compatible native setter
  async function setSelectValue(page: import("@playwright/test").Page, testId: string, value: string) {
    const select = page.locator(`[data-testid='${testId}']`);
    await select.evaluate((el, val) => {
      const s = el as HTMLSelectElement;
      const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value")?.set;
      setter?.call(s, val);
      s.dispatchEvent(new Event("change", { bubbles: true }));
    }, value);
    await page.waitForTimeout(500);
  }

  test("REGRESSION: Honor 25★ → Immortal 100★ = 75 total stars (not 73)", async ({ page }) => {
    // Select current rank = Mythic Honor (auto-sets currentMythicStars to min=25)
    await setSelectValue(page, "perstar-current-rank", "mythichonor");

    // Select target rank = Mythic Immortal (auto-sets targetMythicStars to min=100)
    await setSelectValue(page, "perstar-target-rank", "mythicimmortal");

    // Wait for price card to appear
    await expect(page.locator("text=Estimasi Harga Per Bintang")).toBeVisible({ timeout: 5000 });

    // Total Bintang should be 75 — NOT 73 (old off-by-one bug)
    const totalStarsCard = page.locator("text=Total Bintang").locator("..");
    await expect(totalStarsCard).toContainText("75", { timeout: 5000 });
  });

  test("REGRESSION: Mythic 0★ → Glory 50★ = 50 total stars", async ({ page }) => {
    await setSelectValue(page, "perstar-current-rank", "mythic");
    await setSelectValue(page, "perstar-target-rank", "mythicglory");

    await expect(page.locator("text=Estimasi Harga Per Bintang")).toBeVisible({ timeout: 5000 });

    const totalStarsCard = page.locator("text=Total Bintang").locator("..");
    await expect(totalStarsCard).toContainText("50", { timeout: 5000 });
  });

  test("REGRESSION: Glory 50★ → Immortal 100★ = 50 total stars", async ({ page }) => {
    await setSelectValue(page, "perstar-current-rank", "mythicglory");
    await setSelectValue(page, "perstar-target-rank", "mythicimmortal");

    await expect(page.locator("text=Estimasi Harga Per Bintang")).toBeVisible({ timeout: 5000 });

    const totalStarsCard = page.locator("text=Total Bintang").locator("..");
    await expect(totalStarsCard).toContainText("50", { timeout: 5000 });
  });

  // Helper: extract the total price number from the estimate card.
  // The price <p> has class "text-3xl text-yellow-400" and is the only one
  // visible in perstar mode after rank selection.
  async function getEstimatePrice(page: import("@playwright/test").Page): Promise<number> {
    const priceEl = page.locator("p.font-bold.text-3xl.text-yellow-400, p.text-yellow-400.font-bold.text-3xl").first();
    await expect(priceEl).toBeVisible({ timeout: 5000 });
    const text = await priceEl.textContent();
    const match = text?.match(/Rp\s*([\d.]+)/);
    expect(match).toBeTruthy();
    return parseInt(match![1].replace(/\./g, ""), 10);
  }

  // Helper: fetch live CMS per-star prices (from /api/settings) and return a
  // lookup that accepts multiple candidate ids (raw DB id or canonical id).
  // Keeps price assertions CMS-aware instead of hardcoding amounts that rot
  // whenever admins change prices in the dashboard.
  async function getCmsPerStarPrices(page: import("@playwright/test").Page): Promise<(...ids: string[]) => number> {
    const res = await page.request.get("/api/settings?keys=perstar_pricing");
    const data = await res.json();
    const tiers: { id: string; price: number }[] = data.perstar_pricing || [];
    return (...ids: string[]) => {
      for (const id of ids) {
        const t = tiers.find((x) => x.id === id);
        if (t?.price && t.price > 0) return t.price;
      }
      throw new Error(`CMS perstar price not found for ids: ${ids.join(", ")}`);
    };
  }

  // PRICE regression tests — catch the `mythicroomawi` typo bug where the price
  // silently fell back to grandmaster (Rp 6.000/star) instead of the correct
  // Mythic tier price. If the ID alias doesn't work, these tests will fail
  // because the total price will be far too low.
  test("REGRESSION: Mythic 0★ → Glory 50★ price uses CMS Mythic tier prices", async ({ page }) => {
    const cms = await getCmsPerStarPrices(page);
    const mythicPrice = cms("mythicromawi", "mythic");
    const honorPrice = cms("honor");

    await setSelectValue(page, "perstar-current-rank", "mythic");
    await setSelectValue(page, "perstar-target-rank", "mythicglory");

    await expect(page.locator("text=Estimasi Harga Per Bintang")).toBeVisible({ timeout: 5000 });

    // Mythic 0-25★ = 25 × mythicPrice; Honor 25-50★ = 25 × honorPrice.
    // CMS-aware: the expected value comes from the live perstar_pricing
    // settings — if the "mythic" id-mismatch bug exists, the Mythic segment
    // silently uses the hardcoded default instead of the admin's price.
    const expected = 25 * mythicPrice + 25 * honorPrice;
    const priceNum = await getEstimatePrice(page);
    expect(priceNum).toBe(expected);
  });

  test("REGRESSION: Honor 25★ → Immortal 100★ price uses CMS tier prices", async ({ page }) => {
    const cms = await getCmsPerStarPrices(page);
    const honorPrice = cms("honor");
    const gloryPrice = cms("glory");

    await setSelectValue(page, "perstar-current-rank", "mythichonor");
    await setSelectValue(page, "perstar-target-rank", "mythicimmortal");

    await expect(page.locator("text=Estimasi Harga Per Bintang")).toBeVisible({ timeout: 5000 });

    // Honor 25-50★ = 25 × honorPrice; Glory 50-100★ = 50 × gloryPrice
    const expected = 25 * honorPrice + 50 * gloryPrice;
    const priceNum = await getEstimatePrice(page);
    expect(priceNum).toBe(expected);
  });

  test("REGRESSION: Mythic same-tier (1★ → 2★) uses CMS Mythic price (not the Rp 5.000 fallback)", async ({ page }) => {
    const cms = await getCmsPerStarPrices(page);
    const mythicPrice = cms("mythicromawi", "mythic");

    await setSelectValue(page, "perstar-current-rank", "mythic");

    // Target dropdown should become enabled
    await expect(page.locator("[data-testid='perstar-target-rank']")).toBeEnabled({ timeout: 5000 });

    // Select target = Mythic (same tier, different star count)
    await setSelectValue(page, "perstar-target-rank", "mythic");

    // Same-tier defaults to 0★ → 0★ (no estimate). Drive the star inputs:
    // current 1★ → target 2★ = 1 star.
    await page.locator("[data-testid='perstar-current-mythic-stars']").fill("1");
    await page.locator("[data-testid='perstar-target-mythic-stars']").fill("2");

    await expect(page.locator("text=Estimasi Harga Per Bintang")).toBeVisible({ timeout: 5000 });

    // 1 star × CMS Mythic price — if the id-mismatch fallback bug exists,
    // this would be 1 × Rp 5.000/6.000 (grandmaster fallback).
    const priceNum = await getEstimatePrice(page);
    expect(priceNum).toBe(mythicPrice);
  });

  test("FEATURE: target division star selector — Legend I 3★ adds 3 stars (44 → 47)", async ({ page }) => {
    // Current = Epic (defaults: division V, 1★ in division)
    await setSelectValue(page, "perstar-current-rank", "epic");
    // Target = Legend (defaults: division I, 0★ in division)
    await setSelectValue(page, "perstar-target-rank", "legend");

    await expect(page.locator("text=Estimasi Harga Per Bintang")).toBeVisible({ timeout: 5000 });

    // Star picker for the target division must render 0–4 (Legend: starsPerDiv=5)
    await expect(page.locator("[data-testid='perstar-target-divstar-0']")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("[data-testid='perstar-target-divstar-4']")).toBeVisible();
    await expect(page.locator("[data-testid='perstar-target-divstar-5']")).toHaveCount(0);

    // Default estimate: Epic V 1★ → Legend I 0★ = 24 + 20 = 44 stars
    const totalStarsCard = page.locator("text=Total Bintang").locator("..");
    await expect(totalStarsCard).toContainText("44", { timeout: 5000 });

    // Pick 3★ within the target division → 24 + 23 = 47 stars
    await page.locator("[data-testid='perstar-target-divstar-3']").click();
    await expect(totalStarsCard).toContainText("47", { timeout: 5000 });

    // Estimate price must increase when target division stars are added
    const priceWith3Stars = await getEstimatePrice(page);
    await page.locator("[data-testid='perstar-target-divstar-0']").click();
    const priceWith0Stars = await getEstimatePrice(page);
    expect(priceWith3Stars).toBeGreaterThan(priceWith0Stars);
  });
});
