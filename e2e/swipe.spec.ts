import { test, expect } from "@playwright/test";

test.describe("Swipe/Drag to Rate", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    // Navigate to test vocab study session
    await page.getByRole("heading", { name: "Test 詞彙" }).click();
    await page.getByText("隨機複習（全部卡片）").click();
    await expect(page.locator(".perspective")).toBeVisible();
  });

  async function dragCard(
    page: import("@playwright/test").Page,
    direction: "left" | "right" | "down",
  ) {
    const card = page.locator(".slide-in");
    const box = await card.boundingBox();
    if (!box) throw new Error("Card not found");

    const startX = box.x + box.width / 2;
    const startY = box.y + box.height / 2;
    const distance = 120;

    let endX = startX;
    let endY = startY;
    if (direction === "left") endX = startX - distance;
    if (direction === "right") endX = startX + distance;
    if (direction === "down") endY = startY + distance;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    // Move in steps for smooth drag
    const steps = 5;
    for (let i = 1; i <= steps; i++) {
      const ratio = i / steps;
      await page.mouse.move(
        startX + (endX - startX) * ratio,
        startY + (endY - startY) * ratio,
      );
    }
    await page.mouse.up();
  }

  test("should rate 記住了 by dragging right on unflipped card", async ({
    page,
  }) => {
    await dragCard(page, "right");
    await page.waitForTimeout(300);

    // Should advance to next card (progress shows 1/3)
    await expect(page.getByText(/^1\s*\/\s*3$/)).toBeVisible();
  });

  test("should rate 不會 by dragging left on unflipped card", async ({
    page,
  }) => {
    await dragCard(page, "left");
    await page.waitForTimeout(300);

    // Requeued: total becomes 4 (3 + 1 requeue)
    await expect(page.getByText(/^1\s*\/\s*4$/)).toBeVisible();
  });

  test("should rate 還好 by dragging down on unflipped card", async ({
    page,
  }) => {
    await dragCard(page, "down");
    await page.waitForTimeout(300);

    await expect(page.getByText(/^1\s*\/\s*3$/)).toBeVisible();
  });

  test("should rate by dragging on flipped card", async ({ page }) => {
    // First flip the card
    await page.locator(".perspective").click();
    await expect(page.getByRole("button", { name: "記住了" })).toBeVisible();

    // Now drag right
    await dragCard(page, "right");
    await page.waitForTimeout(300);

    // Should advance
    await expect(page.getByText(/^1\s*\/\s*3$/)).toBeVisible();
  });

  test("should still allow tap to flip after swipe rating", async ({
    page,
  }) => {
    // Swipe to rate the first card
    await dragCard(page, "right");
    await page.waitForTimeout(300);

    // On the next card, tap to flip should still work
    const card = page.locator(".perspective");
    await expect(card).toBeVisible();
    await card.click();

    // Rating buttons should appear (card flipped)
    await expect(page.getByRole("button", { name: "記住了" })).toBeVisible();
  });

  test("should complete session using only swipe gestures", async ({
    page,
  }) => {
    // Swipe through all 3 cards as "good"
    for (let i = 0; i < 3; i++) {
      await expect(page.locator(".perspective")).toBeVisible({ timeout: 5000 });
      await dragCard(page, "right");
      await page.waitForTimeout(400);
    }

    // Should see session summary
    await expect(page.getByText("學習完成！")).toBeVisible({ timeout: 5000 });
  });
});
