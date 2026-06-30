import { test, expect } from "@playwright/test";

test.describe("Calculator Desktop Layout Verification", () => {
  test("desktop 1440px - paket mode default", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/calculator");
    await page.waitForTimeout(2500);
    await page.screenshot({ path: "screenshots/desktop-1440-paket-default.png", fullPage: true });

    // Verify sidebar exists on desktop
    const sidebar = page.locator("aside");
    await expect(sidebar).toBeVisible();

    // Verify mode buttons in sidebar
    const paketBtn = page.locator('aside button:has-text("Paket")');
    await expect(paketBtn).toBeVisible();
  });

  test("desktop 1440px - perstar mode with breakdown", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/calculator");
    await page.waitForTimeout(2000);

    // Click Per Bintang in sidebar
    await page.locator('aside button:has-text("Per Bintang")').click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: "screenshots/desktop-1440-perstar.png", fullPage: true });
  });

  test("desktop 1440px - paket selected with result panel", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/calculator");
    await page.waitForTimeout(2000);

    // Click first package card
    const firstCard = page.locator("button:has-text('Rp')").first();
    await firstCard.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: "screenshots/desktop-1440-paket-result.png", fullPage: true });

    // Verify result panel has Hasil Kalkulasi
    const resultPanel = page.locator("text=Hasil Kalkulasi");
    await expect(resultPanel).toBeVisible();

    // Verify 3-stage workflow visible
    await expect(page.locator("text=Pesan Penawaran")).toBeVisible();
    await expect(page.locator('button:has-text("Copy Format Order")')).toBeVisible();
    await expect(page.locator('button:has-text("Buat Order Manual")')).toBeVisible();
  });

  test("desktop 1920px - ultra-wide layout", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/calculator");
    await page.waitForTimeout(2000);

    // Select a package to see full layout
    const firstCard = page.locator("button:has-text('Rp')").first();
    await firstCard.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: "screenshots/desktop-1920-full.png", fullPage: true });
  });

  test("mobile 390px - responsive check", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/calculator");
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "screenshots/mobile-390-default.png", fullPage: true });

    // Sidebar should NOT be visible on mobile
    const sidebar = page.locator("aside");
    await expect(sidebar).not.toBeVisible();
  });
});