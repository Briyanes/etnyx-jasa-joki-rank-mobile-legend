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
});