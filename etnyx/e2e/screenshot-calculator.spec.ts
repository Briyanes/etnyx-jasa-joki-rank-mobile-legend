import { test, expect } from "@playwright/test";

test("screenshot calculator desktop", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/calculator");
  await page.waitForTimeout(2000);
  await page.screenshot({ path: "screenshots/calc-desktop-full.png", fullPage: true });

  // Click Per Star mode to see breakdown
  await page.click("text=Per Bintang");
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "screenshots/calc-desktop-perstar.png", fullPage: true });

  // Back to paket, click a package to see result panel
  await page.click("text=Paket");
  await page.waitForTimeout(500);
  // Click first package card
  const firstPkg = page.locator("button:has-text('Rp')").first();
  if (await firstPkg.isVisible()) {
    await firstPkg.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: "screenshots/calc-desktop-with-result.png", fullPage: true });
  }
});