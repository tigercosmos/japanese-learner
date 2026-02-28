import { test, expect } from "@playwright/test";

test.describe("Settings Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
  });

  test("should navigate to settings via gear icon", async ({ page }) => {
    const settingsBtn = page.getByRole("button", { name: "設定" });
    await expect(settingsBtn).toBeVisible();
    await settingsBtn.click();
    await expect(page).toHaveURL(/\/settings$/);
    await expect(page.getByRole("heading", { name: "設定" })).toBeVisible();
  });

  test("should toggle dark mode from settings page", async ({ page }) => {
    await page.getByRole("button", { name: "設定" }).click();

    // Find the dark mode toggle (first switch on page)
    const darkModeToggle = page.getByRole("switch").first();
    await expect(darkModeToggle).toBeVisible();

    // Toggle dark mode on
    await darkModeToggle.click();
    await expect(page.locator("html")).toHaveClass(/dark/);

    // Toggle dark mode off
    await darkModeToggle.click();
    await expect(page.locator("html")).not.toHaveClass(/dark/);
  });

  test("should toggle swipe assist from settings page", async ({ page }) => {
    await page.getByRole("button", { name: "設定" }).click();

    // The swipe assist toggle is the second switch
    const swipeToggle = page.getByRole("switch").nth(1);
    await expect(swipeToggle).toBeVisible();
    await expect(swipeToggle).toHaveAttribute("aria-checked", "true");

    // Turn off swipe assist
    await swipeToggle.click();
    await expect(swipeToggle).toHaveAttribute("aria-checked", "false");
  });

  test("should hide swipe hint when swipe assist is disabled", async ({ page }) => {
    // First disable swipe assist in settings
    await page.getByRole("button", { name: "設定" }).click();
    await page.getByRole("switch").nth(1).click();

    // Navigate to a study session
    await page.goBack();
    await page.getByRole("heading", { name: "Test 詞彙" }).click();
    await page.getByText("隨機複習（全部卡片）").click();
    await expect(page).toHaveURL(/\/study\/test-vocab\/session$/);

    // Swipe hint should NOT be visible
    await expect(page.getByText("← 不會 · ↓ 還好 · → 記住了")).not.toBeVisible();
  });

  test("should show swipe hint when swipe assist is enabled", async ({ page }) => {
    // Navigate to a study session (swipe assist on by default)
    await page.getByRole("heading", { name: "Test 詞彙" }).click();
    await page.getByText("隨機複習（全部卡片）").click();
    await expect(page).toHaveURL(/\/study\/test-vocab\/session$/);

    // Swipe hint should be visible (on mobile viewports, but always in DOM)
    // Since Playwright default viewport may not be mobile, check it's in the DOM
    await expect(page.getByText("← 不會 · ↓ 還好 · → 記住了")).toBeAttached();
  });

  test("should persist swipe assist setting across navigation", async ({ page }) => {
    // Disable swipe assist
    await page.getByRole("button", { name: "設定" }).click();
    await page.getByRole("switch").nth(1).click();
    await expect(page.getByRole("switch").nth(1)).toHaveAttribute("aria-checked", "false");

    // Go home and come back to settings
    await page.goto("/");
    await page.getByRole("button", { name: "設定" }).click();

    // Should still be disabled
    await expect(page.getByRole("switch").nth(1)).toHaveAttribute("aria-checked", "false");
  });
});
