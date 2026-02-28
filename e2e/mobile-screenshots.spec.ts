import { test, expect } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

// Mobile viewport matching iPhone 13 (390x844) with touch support
test.use({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  isMobile: true,
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOT_DIR = path.join(__dirname, "..", "test-results", "mobile-screenshots");

// Helper: navigate to study session
async function goToStudySession(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.getByRole("heading", { name: "Test 詞彙" }).click();
  await page.getByText("隨機複習（全部卡片）").click();
  await expect(page.locator(".perspective")).toBeVisible();
}

// Helper: navigate to learn mode (all at once)
async function goToLearnAll(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.getByRole("heading", { name: "Test 詞彙" }).click();
  await page.getByText("學習模式（瀏覽全部卡片）").click();
  await page.getByRole("button", { name: "開始學習" }).click();
  await expect(page).toHaveURL(/\/learn\/test-vocab\/session$/);
}

// Helper: touch drag on a card (returns mid-drag screenshot)
async function touchDragCard(
  page: import("@playwright/test").Page,
  direction: "left" | "right" | "down",
  opts?: { screenshotMidDrag?: string },
) {
  const card = page.locator(".slide-in");
  const box = await card.boundingBox();
  if (!box) throw new Error("Card not found");

  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;
  const distance = 130;

  let endX = startX;
  let endY = startY;
  if (direction === "left") endX = startX - distance;
  if (direction === "right") endX = startX + distance;
  if (direction === "down") endY = startY + distance;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  const steps = 6;
  for (let i = 1; i <= steps; i++) {
    const ratio = i / steps;
    await page.mouse.move(
      startX + (endX - startX) * ratio,
      startY + (endY - startY) * ratio,
    );
  }

  // Take mid-drag screenshot if requested
  if (opts?.screenshotMidDrag) {
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, opts.screenshotMidDrag),
      fullPage: false,
    });
  }

  await page.mouse.up();
}

test.describe("Mobile Screenshots - Visual Verification", () => {
  test("home page - initial load", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await expect(page.getByRole("heading", { name: "學習集" })).toBeVisible();

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "01-home-page.png"),
      fullPage: false,
    });

    // Verify layout: header visible, cards visible, no overflow
    const viewport = page.viewportSize()!;
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(viewport.width);
  });

  test("home page - scrolled state with sticky header", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());

    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 300));
    await page.waitForTimeout(200);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "02-home-scrolled-sticky-header.png"),
      fullPage: false,
    });

    // Header must remain visible after scrolling
    const header = page.locator("header");
    await expect(header).toBeInViewport();
  });

  test("home page - full page screenshot", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await expect(page.getByRole("heading", { name: "學習集" })).toBeVisible();

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "03-home-full-page.png"),
      fullPage: true,
    });
  });

  test("setup page", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.getByRole("heading", { name: "Test 詞彙" }).click();
    await expect(page.getByRole("heading", { name: "Test 詞彙" })).toBeVisible();

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "04-setup-page.png"),
      fullPage: false,
    });

    // Scroll to bottom to verify all buttons are accessible
    await page.getByText("隨機複習（全部卡片）").scrollIntoViewIfNeeded();
    await page.waitForTimeout(100);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "05-setup-page-scrolled.png"),
      fullPage: false,
    });
  });

  test("study session - card front (unflipped)", async ({ page }) => {
    await goToStudySession(page);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "06-study-card-front.png"),
      fullPage: false,
    });

    // Verify key elements visible
    await expect(page.locator(".perspective")).toBeInViewport();
    await expect(page.getByText(/^0\s*\/\s*3$/)).toBeVisible();
    // Swipe hint visible on mobile
    await expect(page.getByText("← 不會 · ↓ 還好 · → 記住了")).toBeVisible();
    // Keyboard hint hidden on mobile
    await expect(
      page.getByText("空白鍵翻面 · 1 不會 · 2 還好 · 3 記住了 · 可拖曳卡片"),
    ).not.toBeVisible();
  });

  test("study session - card back (flipped) with rating buttons", async ({ page }) => {
    await goToStudySession(page);
    // Tap to flip
    await page.locator(".perspective").tap();
    await expect(page.getByRole("button", { name: "記住了" })).toBeVisible();

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "07-study-card-back-with-ratings.png"),
      fullPage: false,
    });

    // Rating buttons should be visible and in viewport
    for (const name of ["不會", "還好", "記住了"]) {
      await expect(page.getByRole("button", { name })).toBeInViewport();
    }
  });

  test("study session - swipe right (good) mid-drag", async ({ page }) => {
    await goToStudySession(page);

    await touchDragCard(page, "right", {
      screenshotMidDrag: "08-swipe-right-mid-drag.png",
    });
    await page.waitForTimeout(300);

    // After swipe completes, should advance
    await expect(page.getByText(/^1\s*\/\s*3$/)).toBeVisible();
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "09-after-swipe-right.png"),
      fullPage: false,
    });
  });

  test("study session - swipe left (again) mid-drag", async ({ page }) => {
    await goToStudySession(page);

    await touchDragCard(page, "left", {
      screenshotMidDrag: "10-swipe-left-mid-drag.png",
    });
    await page.waitForTimeout(300);

    // Requeued: total becomes 4
    await expect(page.getByText(/^1\s*\/\s*4$/)).toBeVisible();
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "11-after-swipe-left-requeued.png"),
      fullPage: false,
    });
  });

  test("study session - swipe down (hard) mid-drag", async ({ page }) => {
    await goToStudySession(page);

    await touchDragCard(page, "down", {
      screenshotMidDrag: "12-swipe-down-mid-drag.png",
    });
    await page.waitForTimeout(300);

    await expect(page.getByText(/^1\s*\/\s*3$/)).toBeVisible();
  });

  test("study session - completion summary", async ({ page }) => {
    await goToStudySession(page);

    // Complete all 3 cards with mixed ratings
    // Card 1: good (swipe right)
    await touchDragCard(page, "right");
    await page.waitForTimeout(400);
    // Card 2: hard (swipe down)
    await touchDragCard(page, "down");
    await page.waitForTimeout(400);
    // Card 3: good (tap + button)
    await page.locator(".perspective").tap();
    await page.getByRole("button", { name: "記住了" }).tap();
    await page.waitForTimeout(300);

    await expect(page.getByText("學習完成！")).toBeVisible({ timeout: 5000 });

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "13-session-summary.png"),
      fullPage: false,
    });

    // Verify summary content is visible
    await expect(page.getByRole("button", { name: "再來一次" })).toBeInViewport();

    // Scroll to "回首頁" and screenshot
    const homeBtn = page.getByRole("button", { name: "回首頁" });
    await homeBtn.scrollIntoViewIfNeeded();
    await expect(homeBtn).toBeInViewport();

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "14-session-summary-scrolled.png"),
      fullPage: false,
    });
  });

  test("learn mode - card browsing", async ({ page }) => {
    await goToLearnAll(page);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "15-learn-card-1.png"),
      fullPage: false,
    });

    // Navigate to next card
    await page.getByRole("button", { name: /下一張/ }).tap();
    await page.waitForTimeout(300);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "16-learn-card-2.png"),
      fullPage: false,
    });

    // Verify buttons visible
    await expect(page.getByRole("button", { name: /上一張/ })).toBeEnabled();
    await expect(page.getByRole("button", { name: /下一張/ })).toBeInViewport();
  });

  test("learn mode - completion screen", async ({ page }) => {
    await goToLearnAll(page);

    // Navigate through all 3 cards
    for (let i = 0; i < 3; i++) {
      await page.getByRole("button", { name: /下一張|完成/ }).tap();
      await page.waitForTimeout(200);
    }

    await expect(page.getByText("瀏覽完成！")).toBeVisible();

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "17-learn-completion.png"),
      fullPage: false,
    });

    // All buttons should be reachable
    const examBtn = page.getByRole("button", { name: "去測驗" });
    await examBtn.scrollIntoViewIfNeeded();
    await expect(examBtn).toBeInViewport();
  });

  test("dark mode - study session", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());

    // Enable dark mode
    await page.locator("header button").first().tap();
    await expect(page.locator("html")).toHaveClass(/dark/);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "18-home-dark-mode.png"),
      fullPage: false,
    });

    // Navigate to study session
    await page.getByRole("heading", { name: "Test 詞彙" }).tap();
    await page.getByText("隨機複習（全部卡片）").tap();
    await expect(page.locator(".perspective")).toBeVisible();

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "19-study-dark-mode.png"),
      fullPage: false,
    });

    // Flip card
    await page.locator(".perspective").tap();
    await expect(page.getByRole("button", { name: "記住了" })).toBeVisible();

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "20-study-flipped-dark-mode.png"),
      fullPage: false,
    });
  });

  test("settings page on mobile", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.getByRole("button", { name: "設定" }).tap();
    await expect(page.getByRole("heading", { name: "設定" })).toBeVisible();

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "21-settings-page.png"),
      fullPage: false,
    });
  });

  test("study session - full flow with scroll verification", async ({ page }) => {
    await goToStudySession(page);

    // Card 1: tap flip + rating button
    await page.locator(".perspective").tap();
    await expect(page.getByRole("button", { name: "記住了" })).toBeVisible();

    // Verify no unexpected scroll happened during flip
    const scrollAfterFlip = await page.evaluate(() => window.scrollY);
    expect(scrollAfterFlip).toBe(0);

    await page.getByRole("button", { name: "不會" }).tap();
    await page.waitForTimeout(300);

    // Card 2: swipe right
    await touchDragCard(page, "right");
    await page.waitForTimeout(300);

    // Still no unexpected scroll
    const scrollAfterSwipe = await page.evaluate(() => window.scrollY);
    expect(scrollAfterSwipe).toBe(0);

    // Card 3: swipe down
    await touchDragCard(page, "down");
    await page.waitForTimeout(300);

    // Card 1 requeued: swipe right
    await expect(page.locator(".perspective")).toBeVisible({ timeout: 5000 });
    await touchDragCard(page, "right");
    await page.waitForTimeout(300);

    // Completion
    await expect(page.getByText("學習完成！")).toBeVisible({ timeout: 5000 });

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "22-final-summary-after-full-flow.png"),
      fullPage: false,
    });

    // Summary stats grid should fit
    const statsGrid = page.locator(".grid.grid-cols-3");
    const gridBox = await statsGrid.boundingBox();
    const viewport = page.viewportSize()!;
    expect(gridBox).not.toBeNull();
    expect(gridBox!.width).toBeLessThanOrEqual(viewport.width);
  });
});
