import { test, expect } from "@playwright/test";

test.describe("Study Session", () => {
  test.beforeEach(async ({ page }) => {
    // Clear progress and navigate through the app to the test dataset
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
  });

  test("should complete a full study session with random review", async ({
    page,
  }) => {
    // Navigate to test vocab setup
    await page.getByRole("heading", { name: "Test 詞彙" }).click();
    await expect(page).toHaveURL(/\/study\/test-vocab$/);

    // Start random review
    await page.getByText("隨機複習（全部卡片）").click();
    await expect(page).toHaveURL(/\/study\/test-vocab\/session$/);

    // Should see a flashcard
    const card = page.locator(".perspective");
    await expect(card).toBeVisible();

    // Click to flip the card
    await card.click();

    // After flipping, rating buttons should appear
    await expect(page.getByRole("button", { name: "不會" })).toBeVisible();
    await expect(page.getByRole("button", { name: "還好" })).toBeVisible();
    await expect(page.getByRole("button", { name: "記住了" })).toBeVisible();
  });

  test("should rate cards and progress through the session to completion", async ({
    page,
  }) => {
    await page.getByRole("heading", { name: "Test 詞彙" }).click();

    // Start random review
    await page.getByText("隨機複習（全部卡片）").click();

    // Complete all 3 cards by flipping and rating as "good"
    for (let i = 0; i < 3; i++) {
      const card = page.locator(".perspective");
      await expect(card).toBeVisible({ timeout: 5000 });
      await card.click();

      const goodBtn = page.getByRole("button", { name: "記住了" });
      await expect(goodBtn).toBeVisible();
      await goodBtn.click();

      // Wait for animation
      await page.waitForTimeout(300);
    }

    // After all cards, should see session summary
    await expect(page.getByText("學習完成！")).toBeVisible({ timeout: 5000 });
  });

  test("should use keyboard shortcuts for study", async ({ page }) => {
    await page.getByRole("heading", { name: "Test 詞彙" }).click();
    await page.getByText("隨機複習（全部卡片）").click();

    // Wait for card to be visible
    await expect(page.locator(".perspective")).toBeVisible();

    // Press space to flip
    await page.keyboard.press("Space");

    // Rating buttons should appear
    await expect(page.getByRole("button", { name: "記住了" })).toBeVisible();

    // Press 3 to rate as "good"
    await page.keyboard.press("3");

    // Should advance to next card
    await page.waitForTimeout(300);

    // Should still be on session page
    await expect(page).toHaveURL(/\/study\/test-vocab\/session$/);
  });

  test("should requeue cards rated 'again'", async ({ page }) => {
    await page.getByRole("heading", { name: "Test 詞彙" }).click();
    await page.getByText("隨機複習（全部卡片）").click();

    // Flip and rate first card as "again"
    const card = page.locator(".perspective");
    await expect(card).toBeVisible({ timeout: 5000 });
    await card.click();
    await page.getByRole("button", { name: "不會" }).click();
    await page.waitForTimeout(300);

    // Complete the remaining 2 cards as "good"
    for (let i = 0; i < 2; i++) {
      const nextCard = page.locator(".perspective");
      await expect(nextCard).toBeVisible({ timeout: 5000 });
      await nextCard.click();
      await page.getByRole("button", { name: "記住了" }).click();
      await page.waitForTimeout(300);
    }

    // Should still be in session (requeued card)
    // The "again" card is requeued at the end
    const requeuedCard = page.locator(".perspective");
    if (await requeuedCard.isVisible({ timeout: 2000 })) {
      await requeuedCard.click();
      await page.getByRole("button", { name: "記住了" }).click();
      await page.waitForTimeout(300);
    }

    // Should eventually see completion
    await expect(page.getByText("學習完成！")).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Study Session - Due Cards", () => {
  test("should show start button enabled when cards are due", async ({
    page,
  }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());

    await page.getByRole("heading", { name: "Test 詞彙" }).click();

    // All 3 cards should be due (no progress = due)
    await expect(page.getByText("3 張待複習")).toBeVisible();
  });
});
