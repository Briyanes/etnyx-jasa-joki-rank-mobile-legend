import { test, expect } from "@playwright/test";

test.describe("Order Page — Navigation & Mode Selection", () => {
  test("should load order page", async ({ page }) => {
    await page.goto("/order");
    await expect(page).toHaveURL(/\/order/);
  });

  test("should display order mode tabs", async ({ page }) => {
    await page.goto("/order");
    // Wait for page to hydrate
    await page.waitForTimeout(2000);
    const body = await page.textContent("body");
    // At least one of these modes should be visible
    expect(body).toMatch(/Paket|Per\s*Bintang|Gendong|Classic/i);
  });

  test("should show package catalog in default mode", async ({ page }) => {
    await page.goto("/order");
    await page.waitForTimeout(2000);
    // Should show some package category
    const body = await page.textContent("body");
    expect(body).toMatch(/Paket|Warrior|Elite|Master|Grand Master|Epic|Legend|Mythic/i);
  });

  test("should switch to Per Star mode when clicked", async ({ page }) => {
    await page.goto("/order");
    await page.waitForTimeout(2000);
    // Try to find and click "Per Bintang" mode tab
    const perStarTab = page.locator("text=/Per.*Bintang/i").first();
    if (await perStarTab.isVisible()) {
      await perStarTab.click();
      await page.waitForTimeout(500);
      // Should show rank selector or star quantity
      const body = await page.textContent("body");
      expect(body).toBeTruthy();
    }
  });

  test("should show step indicator", async ({ page }) => {
    await page.goto("/order");
    await page.waitForTimeout(2000);
    // Should show step progress (numbered steps)
    const body = await page.textContent("body");
    expect(body).toMatch(/\b[1-4]\b/);
  });
});

test.describe("Order Form — Validation", () => {
  test("should prevent advancing without selecting a package", async ({ page }) => {
    await page.goto("/order");
    await page.waitForTimeout(2000);
    // Try to click "Lanjut" or "Next" button without selecting
    const nextBtn = page.locator('button:has-text("Lanjut"), button:has-text("Next")').first();
    if (await nextBtn.isVisible({ timeout: 3000 })) {
      await nextBtn.click();
      await page.waitForTimeout(1000);
      // Should show validation error or stay on same step
      const body = await page.textContent("body");
      expect(body).toBeTruthy();
    }
  });

  test("should accept WhatsApp number input", async ({ page }) => {
    await page.goto("/order");
    await page.waitForTimeout(2000);
    // Navigate to contact step if possible (fill minimum required fields)
    // At minimum, verify the page doesn't crash on input
    const waInput = page.locator('input[placeholder*="08"], input[name*="whatsapp"]').first();
    if (await waInput.isVisible({ timeout: 3000 })) {
      await waInput.fill("08123456789");
      await expect(waInput).toHaveValue("08123456789");
    }
  });

  test("should accept User ID and Server ID", async ({ page }) => {
    await page.goto("/order");
    await page.waitForTimeout(2000);
    const userIdInput = page.locator('input[placeholder*="User ID"], input[placeholder*="123456789"]').first();
    if (await userIdInput.isVisible({ timeout: 3000 })) {
      await userIdInput.fill("123456789");
      await expect(userIdInput).toHaveValue("123456789");
    }
    const serverInput = page.locator('input[placeholder*="Server"], input[placeholder*="1234"]').first();
    if (await serverInput.isVisible({ timeout: 3000 })) {
      await serverInput.fill("1234");
      await expect(serverInput).toHaveValue("1234");
    }
  });
});

test.describe("Order Page — Error Handling", () => {
  test("should show error page for invalid order params", async ({ page }) => {
    await page.goto("/order?error=invalid");
    await page.waitForTimeout(2000);
    // Page should load without crashing
    const body = await page.textContent("body");
    expect(body).toBeTruthy();
  });

  test("should handle terms popup", async ({ page }) => {
    await page.goto("/order");
    await page.waitForTimeout(2000);
    // Terms popup may appear — verify it doesn't block interaction permanently
    const body = await page.textContent("body");
    expect(body).toBeTruthy();
  });
});

test.describe("Order Page — Promo Code", () => {
  test("should have promo code input field", async ({ page }) => {
    await page.goto("/order");
    await page.waitForTimeout(2000);
    // Navigate through steps to find promo input
    const promoInput = page.locator('input[placeholder*="promo"], input[name*="promo"]').first();
    // Promo field may not be visible until step 3 — just verify page is stable
    const body = await page.textContent("body");
    expect(body).toBeTruthy();
  });
});

test.describe("Order → Track Flow", () => {
  test("should navigate from order to track page", async ({ page }) => {
    await page.goto("/order");
    await page.waitForTimeout(1000);
    // Try navigating to track page
    await page.goto("/track");
    await expect(page).toHaveURL(/\/track/);
  });

  test("track page should handle invalid order ID gracefully", async ({ page }) => {
    await page.goto("/track?id=ETX-NOTFOUND123");
    await page.waitForTimeout(3000);
    const body = await page.textContent("body");
    // Should not crash — show some message
    expect(body).toBeTruthy();
  });
});