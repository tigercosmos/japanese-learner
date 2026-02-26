import { test, expect } from "@playwright/test";

test.describe("App Navigation", () => {
  test("should navigate home from header title", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("heading", { name: "Test 詞彙" }).click();
    await expect(page).toHaveURL(/\/study\/test-vocab$/);

    // Click the header title to go home
    await page.locator("header h1").click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { name: "學習集" })).toBeVisible();
  });

  test("should navigate home → setup → session → summary → home", async ({
    page,
  }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());

    // Home → Setup
    await page.getByRole("heading", { name: "Test 詞彙" }).click();
    await expect(page).toHaveURL(/\/study\/test-vocab$/);

    // Setup → Session (random review)
    await page.getByText("隨機複習（全部卡片）").click();
    await expect(page).toHaveURL(/\/study\/test-vocab\/session$/);

    // Complete all 3 cards by clicking rather than keyboard
    for (let i = 0; i < 3; i++) {
      // Click to flip
      const card = page.locator(".perspective");
      await expect(card).toBeVisible({ timeout: 5000 });
      await card.click();

      // Click "記住了"
      const goodBtn = page.getByRole("button", { name: "記住了" });
      await expect(goodBtn).toBeVisible();
      await goodBtn.click();
      await page.waitForTimeout(300);
    }

    // Should be at summary
    await expect(page.getByText("學習完成！")).toBeVisible({ timeout: 5000 });

    // Summary → Home
    await page.getByRole("button", { name: "回首頁" }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test("should handle missing dataset gracefully", async ({ page }) => {
    // Navigate within the SPA to a nonexistent dataset
    await page.goto("/");
    await page.evaluate(() => {
      window.history.pushState({}, "", "/japanese-learner/study/nonexistent-dataset");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    // React Router should render the SetupPage with undefined dataset
    await expect(page.getByText("找不到學習集")).toBeVisible({ timeout: 10000 });
  });

  test("should handle missing dataset in learn mode", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      window.history.pushState({}, "", "/japanese-learner/learn/nonexistent-dataset");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    await expect(page.getByText("找不到學習集")).toBeVisible({ timeout: 10000 });
  });

  test("should use back button to navigate", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("heading", { name: "Test 詞彙" }).click();
    await expect(page).toHaveURL(/\/study\/test-vocab$/);

    // Click the back button (aria-label: 返回)
    await page.getByLabel("返回").click();
    await expect(page).toHaveURL(/\/$/);
  });
});
