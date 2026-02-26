import { test, expect } from "@playwright/test";

test.describe("Setup Page - Vocabulary", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    // Navigate to the test vocab dataset setup page
    await page.getByRole("heading", { name: "Test 詞彙" }).click();
    await expect(page).toHaveURL(/\/study\/test-vocab$/);
  });

  test("should display dataset name and card count", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Test 詞彙" })).toBeVisible();
    await expect(page.getByText("3 張卡片")).toBeVisible();
  });

  test("should display vocab test mode options", async ({ page }) => {
    await expect(page.getByText("漢字 → 中文")).toBeVisible();
    await expect(page.getByText("假名 → 中文")).toBeVisible();
    await expect(page.getByText("中文 → 日文")).toBeVisible();
  });

  test("should display session size options", async ({ page }) => {
    await expect(page.getByText("每次數量")).toBeVisible();
    await expect(page.getByRole("button", { name: "10" })).toBeVisible();
    await expect(page.getByRole("button", { name: "20" })).toBeVisible();
    await expect(page.getByRole("button", { name: "全部", exact: true })).toBeVisible();
  });

  test("should have learning mode button", async ({ page }) => {
    await expect(page.getByText("學習模式（瀏覽全部卡片）")).toBeVisible();
  });

  test("should have random review button", async ({ page }) => {
    await expect(page.getByText("隨機複習（全部卡片）")).toBeVisible();
  });

  test("should display statistics panel", async ({ page }) => {
    await expect(page.getByText("總卡片數")).toBeVisible();
    await expect(page.getByText("已學習")).toBeVisible();
  });

  test("should navigate to learn mode", async ({ page }) => {
    await page.getByText("學習模式（瀏覽全部卡片）").click();
    await expect(page).toHaveURL(/\/learn\/test-vocab$/);
  });

  test("should navigate to study session via random review", async ({
    page,
  }) => {
    await page.getByText("隨機複習（全部卡片）").click();
    await expect(page).toHaveURL(/\/study\/test-vocab\/session$/);
  });

  test("should show due card count", async ({ page }) => {
    // All 3 cards should be due (new cards = due)
    await expect(page.getByText("3 張待複習")).toBeVisible();
  });
});

test.describe("Setup Page - Grammar", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.getByRole("heading", { name: "Test 文法" }).click();
    await expect(page).toHaveURL(/\/study\/test-grammar$/);
  });

  test("should display grammar test mode options", async ({ page }) => {
    await expect(page.getByText("文法 → 中文")).toBeVisible();
    await expect(page.getByText("例句 → 中文")).toBeVisible();
    await expect(page.getByText("中文 → 文法")).toBeVisible();
    await expect(page.getByText("填空 → 文法")).toBeVisible();
  });
});
