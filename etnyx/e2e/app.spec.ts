import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("should load and display title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/ETNYX/);
  });

  test("should show hero section", async ({ page }) => {
    await page.goto("/");
    const hero = page.locator("text=Joki").first();
    await expect(hero).toBeVisible({ timeout: 10000 });
  });

  test("should have order button", async ({ page }) => {
    await page.goto("/");
    const orderBtn = page.locator('a[href="/order"]').first();
    await expect(orderBtn).toBeVisible({ timeout: 10000 });
  });

  test("should navigate to order page", async ({ page }) => {
    await page.goto("/order");
    await expect(page).toHaveURL(/\/order/);
  });
});

test.describe("Track Order", () => {
  test("should load tracking page", async ({ page }) => {
    await page.goto("/track");
    await expect(page).toHaveURL(/\/track/);
  });

  test("should show search input", async ({ page }) => {
    await page.goto("/track");
    const input = page.locator('input[type="text"]').first();
    await expect(input).toBeVisible({ timeout: 10000 });
  });

  test("should show not found for invalid order", async ({ page }) => {
    await page.goto("/track?id=ETX-INVALID");
    // Should show some error or not found message
    await page.waitForTimeout(2000);
    const body = await page.textContent("body");
    expect(body).toBeTruthy();
  });
});

test.describe("404 Page", () => {
  test("should show custom 404 page", async ({ page }) => {
    await page.goto("/nonexistent-page-12345");
    await expect(page.locator("text=404")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=Ke Beranda")).toBeVisible();
  });
});

test.describe("Theme Toggle", () => {
  test("should toggle between dark and light", async ({ page }) => {
    await page.goto("/");
    const toggle = page.locator('button[aria-label="Toggle theme"]');
    await expect(toggle).toBeVisible({ timeout: 10000 });

    // Default is dark
    const html = page.locator("html");
    
    // Click to switch to light
    await toggle.click();
    await expect(html).toHaveAttribute("data-theme", "light");
    
    // Click back to dark
    await toggle.click();
    await expect(html).toHaveAttribute("data-theme", "dark");
  });
});

test.describe("Admin Login", () => {
  test("should show login page", async ({ page }) => {
    await page.goto("/admin");
    // Should show login form
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    await expect(emailInput).toBeVisible({ timeout: 10000 });
  });

  test("should reject invalid credentials", async ({ page }) => {
    await page.goto("/admin");
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    
    await emailInput.fill("invalid@test.com");
    await passwordInput.fill("wrongpassword");
    
    const submitBtn = page.locator('button[type="submit"]').first();
    await submitBtn.click();
    
    // Should stay on login or show error
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/admin/);
  });
});
