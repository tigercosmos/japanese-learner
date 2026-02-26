import { test, expect } from "@playwright/test";

test.describe("Home Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display the header title", async ({ page }) => {
    await expect(page.locator("header h1")).toHaveText("日語學習卡");
  });

  test("should display test dataset cards", async ({ page }) => {
    // The test fixtures should appear
    await expect(page.getByRole("heading", { name: "Test 詞彙" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Test 文法" })).toBeVisible();
  });

  test("should display section heading and subtitle", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "學習集" })).toBeVisible();
    await expect(page.getByText("選擇一個學習集開始複習")).toBeVisible();
  });

  test("should navigate to setup page when clicking a dataset", async ({
    page,
  }) => {
    await page.getByRole("heading", { name: "Test 詞彙" }).click();
    await expect(page).toHaveURL(/\/study\/test-vocab$/);
    await expect(page.getByRole("heading", { name: "Test 詞彙" })).toBeVisible();
  });

  test("should filter datasets by category", async ({ page }) => {
    // Find and click the vocabulary filter button
    const vocabFilter = page.getByRole("button", { name: "vocabulary" });
    if (await vocabFilter.isVisible()) {
      await vocabFilter.click();
      await expect(page.getByRole("heading", { name: "Test 詞彙" })).toBeVisible();
      await expect(page.getByRole("heading", { name: "Test 文法" })).not.toBeVisible();
    }
  });
});
