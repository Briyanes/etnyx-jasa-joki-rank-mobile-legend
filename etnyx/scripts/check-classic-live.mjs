/**
 * Check if Joki Classic cards appear on live order page.
 * Usage: node scripts/check-classic-live.mjs
 */
import { chromium } from "playwright";
import { mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCREENSHOT_DIR = join(__dirname, "..", "screenshots");

const URL = "https://etnyx.com/order?mode=classic";

(async () => {
  mkdirSync(SCREENSHOT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
  });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  const networkErrors = [];
  page.on("requestfailed", (req) => networkErrors.push(`${req.url()} ${req.failure()?.errorText}`));

  console.log("➡️  Navigating to:", URL);
  await page.goto(URL, { waitUntil: "networkidle", timeout: 60000 });

  // Wait for page to render
  await page.waitForSelector("button", { timeout: 15000 });
  await page.waitForTimeout(1500);

  // Dismiss TermsPopup if present (z-[200] overlay intercepts clicks)
  const popupAcceptBtn = page.getByRole("button", { name: /setuju|saya setuju|agree|accept|lanjut|ok|mengerti|paham|close|tutup/i });
  const popupBtnCount = await popupAcceptBtn.count();
  console.log("🔍 Popup accept buttons found:", popupBtnCount);
  if (popupBtnCount > 0) {
    await popupAcceptBtn.first().click({ timeout: 5000 }).catch(() => {});
    console.log("✅ Dismissed TermsPopup");
    await page.waitForTimeout(500);
  } else {
    // Fallback: hide overlay via JS
    await page.evaluate(() => {
      document.querySelectorAll('div.fixed.inset-0.z-\\[200\\]').forEach(el => el.remove());
    }).catch(() => {});
    console.log("✅ Removed overlay via JS fallback");
    await page.waitForTimeout(500);
  }

  // Verify mode is classic (via URL param, it should be auto-set)
  // Also click the classic button to be safe (force-click to bypass any overlay)
  const classicBtn = page.getByRole("button", { name: /joki classic|classic boost/i });
  const btnCount = await classicBtn.count();
  console.log("🔎 'Joki Classic' buttons found:", btnCount);
  if (btnCount > 0) {
    await classicBtn.first().click({ force: true, timeout: 5000 }).catch(() => {});
    console.log("✅ Clicked 'Joki Classic' button (force)");
  }

  // Give the catalog a moment to render after mode switch
  await page.waitForTimeout(2500);

  // Count category tabs (the horizontal scroll buttons with titles)
  // These are inside the catalog container after the price list
  const tabButtons = await page.locator("div.flex.gap-2.mb-4.overflow-x-auto button").allTextContents();
  console.log("🗂️  Category tabs visible:", tabButtons);

  // Count the package cards (buttons with gradient bg from-slate-700)
  const cardCount = await page.locator("button:has(p.text-yellow-400.font-bold)").count();
  console.log("📦 Classic package cards visible:", cardCount);

  // Try to extract card titles & prices
  const cardTitles = await page.locator("button:has(p.text-yellow-400.font-bold) p.text-white.text-sm.font-semibold").allTextContents();
  const cardPrices = await page.locator("button:has(p.text-yellow-400.font-bold) p.text-yellow-400").allTextContents();
  console.log("🏷️  Card titles:", cardTitles.slice(0, 10));
  console.log("💰 Card prices:", cardPrices.slice(0, 10));

  // Take a screenshot
  const screenshotPath = join(SCREENSHOT_DIR, "classic-check.png");
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log("📸 Screenshot saved:", screenshotPath);

  // Report errors if any
  if (consoleErrors.length > 0) {
    console.log("\n⚠️  Console errors detected:");
    consoleErrors.slice(0, 5).forEach((e) => console.log("   -", e));
  }
  if (networkErrors.length > 0) {
    console.log("\n⚠️  Network errors detected:");
    networkErrors.slice(0, 5).forEach((e) => console.log("   -", e));
  }

  await browser.close();

  // Exit status
  if (cardCount > 0) {
    console.log(`\n✅ SUCCESS: ${cardCount} classic cards are visible on live site!`);
    process.exit(0);
  } else {
    console.log("\n❌ FAIL: No classic cards visible. Check if classic_pricing_catalog exists in DB.");
    process.exit(1);
  }
})().catch((err) => {
  console.error("💥 Script crashed:", err);
  process.exit(2);
});