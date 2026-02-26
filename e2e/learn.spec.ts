import { test, expect } from "@playwright/test";

test.describe("Learn Mode - Vocabulary", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    // Navigate to test vocab learn page
    await page.getByRole("heading", { name: "Test 詞彙" }).click();
    await page.getByText("學習模式（瀏覽全部卡片）").click();
    await expect(page).toHaveURL(/\/learn\/test-vocab$/);
  });

  test("should display first card with navigation buttons", async ({
    page,
  }) => {
    await expect(page.getByRole("button", { name: /上一張/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /下一張/ })).toBeVisible();
  });

  test("should navigate between cards with buttons", async ({ page }) => {
    const prevBtn = page.getByRole("button", { name: /上一張/ });
    const nextBtn = page.getByRole("button", { name: /下一張/ });

    // Previous should be disabled on first card
    await expect(prevBtn).toBeDisabled();

    // Click next
    await nextBtn.click();
    await page.waitForTimeout(200);

    // Previous should now be enabled
    await expect(prevBtn).toBeEnabled();

    // Advance to last card
    await nextBtn.click();
    await page.waitForTimeout(200);

    // On last card, button should say "完成"
    await expect(page.getByRole("button", { name: "完成" })).toBeVisible();
  });

  test("should show completion screen after all cards", async ({ page }) => {
    // Navigate through all 3 cards
    for (let i = 0; i < 3; i++) {
      const btn = page.getByRole("button", { name: /下一張|完成/ });
      await btn.click();
      await page.waitForTimeout(200);
    }

    // Should show completion view
    await expect(page.getByText("瀏覽完成！")).toBeVisible();
    await expect(page.getByText("已看完全部 3 張卡片")).toBeVisible();
    await expect(page.getByRole("button", { name: "從頭開始" })).toBeVisible();
    await expect(page.getByRole("button", { name: "去測驗" })).toBeVisible();
  });

  test("should restart from beginning", async ({ page }) => {
    // Go through all cards
    for (let i = 0; i < 3; i++) {
      const btn = page.getByRole("button", { name: /下一張|完成/ });
      await btn.click();
      await page.waitForTimeout(200);
    }

    // Click "從頭開始"
    await page.getByRole("button", { name: "從頭開始" }).click();

    // Should be back at first card
    await expect(page.getByRole("button", { name: /上一張/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /下一張/ })).toBeVisible();
  });

  test("should navigate to study page from completion", async ({ page }) => {
    for (let i = 0; i < 3; i++) {
      const btn = page.getByRole("button", { name: /下一張|完成/ });
      await btn.click();
      await page.waitForTimeout(200);
    }

    await page.getByRole("button", { name: "去測驗" }).click();
    await expect(page).toHaveURL(/\/study\/test-vocab$/);
  });

  test("should support keyboard navigation", async ({ page }) => {
    // Click on the page to ensure focus
    await page.locator("main").click();
    await page.waitForTimeout(100);

    // Press right arrow to go next
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(300);

    // Previous button should now be enabled (we moved to card 2)
    await expect(page.getByRole("button", { name: /上一張/ })).toBeEnabled();

    // Press left arrow to go back
    await page.keyboard.press("ArrowLeft");
    await page.waitForTimeout(300);

    // Back at first card, previous should be disabled
    await expect(page.getByRole("button", { name: /上一張/ })).toBeDisabled();
  });
});

test.describe("Learn Mode - Grammar", () => {
  test("should display grammar card with navigation", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.getByRole("heading", { name: "Test 文法" }).click();
    await page.getByText("學習模式（瀏覽全部卡片）").click();
    await expect(page).toHaveURL(/\/learn\/test-grammar$/);

    await expect(page.getByRole("button", { name: /上一張/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /下一張/ })).toBeVisible();
  });
});
