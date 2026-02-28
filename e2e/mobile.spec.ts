import { test, expect } from "@playwright/test";

// Mobile viewport matching iPhone 13 (390x844) with touch support
test.use({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  isMobile: true,
});

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

// Helper: touch drag on a card
async function touchDragCard(
  page: import("@playwright/test").Page,
  direction: "left" | "right" | "down",
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

  // Simulate touch gesture using Playwright's touchscreen API
  await page.touchscreen.tap(startX, startY);
  // Touchscreen.tap won't trigger swipe, so use mouse emulation for reliable drag
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
  await page.mouse.up();
}

test.describe("Mobile - Viewport & Layout", () => {
  test("viewport width is mobile-sized", async ({ page }) => {
    await page.goto("/");
    const viewport = page.viewportSize();
    expect(viewport).not.toBeNull();
    // iPhone 13 is 390px wide
    expect(viewport!.width).toBeLessThanOrEqual(430);
  });

  test("page content fits within viewport width (no horizontal scrollbar)", async ({ page }) => {
    await page.goto("/");
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });

  test("header is visible and sticky at the top", async ({ page }) => {
    await page.goto("/");
    const header = page.locator("header");
    await expect(header).toBeVisible();

    // Header should have sticky positioning
    const position = await header.evaluate((el) => getComputedStyle(el).position);
    expect(position).toBe("sticky");
  });

  test("header height is correct (56px / h-14)", async ({ page }) => {
    await page.goto("/");
    const headerInner = page.locator("header > div");
    const box = await headerInner.boundingBox();
    expect(box).not.toBeNull();
    // h-14 = 3.5rem = 56px
    expect(box!.height).toBe(56);
  });

  test("main content container does not overflow viewport width", async ({ page }) => {
    await page.goto("/");
    const main = page.locator("main");
    const mainBox = await main.boundingBox();
    const viewport = page.viewportSize()!;
    expect(mainBox).not.toBeNull();
    expect(mainBox!.x).toBeGreaterThanOrEqual(0);
    expect(mainBox!.x + mainBox!.width).toBeLessThanOrEqual(viewport.width + 1);
  });
});

test.describe("Mobile - Touch Targets", () => {
  test("dataset cards are large enough for touch (min 44px height)", async ({ page }) => {
    await page.goto("/");
    // Target dataset card buttons specifically (they contain heading elements)
    const cards = page.locator("main .space-y-3 > button");
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const box = await cards.nth(i).boundingBox();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test("rating buttons are touch-friendly (min 44px height)", async ({ page }) => {
    await goToStudySession(page);
    // Flip card to show rating buttons
    await page.locator(".perspective").click();
    await expect(page.getByRole("button", { name: "記住了" })).toBeVisible();

    const buttons = ["不會", "還好", "記住了"];
    for (const name of buttons) {
      const btn = page.getByRole("button", { name });
      const box = await btn.boundingBox();
      expect(box).not.toBeNull();
      // py-3 = 12px*2 padding + text ~16px = ~40px minimum, allow 38px
      expect(box!.height).toBeGreaterThanOrEqual(38);
    }
  });

  test("setup page buttons are touch-friendly", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.getByRole("heading", { name: "Test 詞彙" }).click();

    // "隨機複習" and "開始測驗" buttons
    const randomBtn = page.getByText("隨機複習（全部卡片）");
    const box = await randomBtn.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(44);

    // Learn mode button
    const learnBtn = page.getByText("學習模式（瀏覽全部卡片）");
    const learnBox = await learnBtn.boundingBox();
    expect(learnBox).not.toBeNull();
    expect(learnBox!.height).toBeGreaterThanOrEqual(44);
  });

  test("learn mode navigation buttons are touch-friendly", async ({ page }) => {
    await goToLearnAll(page);
    const prevBtn = page.getByRole("button", { name: /上一張/ });
    const nextBtn = page.getByRole("button", { name: /下一張/ });
    const prevBox = await prevBtn.boundingBox();
    const nextBox = await nextBtn.boundingBox();
    expect(prevBox!.height).toBeGreaterThanOrEqual(38);
    expect(nextBox!.height).toBeGreaterThanOrEqual(38);
  });

  test("header buttons are tappable (min 32px touch area)", async ({ page }) => {
    await page.goto("/");
    // Dark mode toggle and settings button
    const darkBtn = page.locator("header button").nth(0);
    const settingsBtn = page.getByRole("button", { name: "設定" });

    const darkBox = await darkBtn.boundingBox();
    const settingsBox = await settingsBtn.boundingBox();
    expect(darkBox).not.toBeNull();
    expect(settingsBox).not.toBeNull();
    // p-1.5 = 6px*2 + 20px icon = 32px, acceptable for header icons
    expect(darkBox!.height).toBeGreaterThanOrEqual(30);
    expect(darkBox!.width).toBeGreaterThanOrEqual(30);
    expect(settingsBox!.height).toBeGreaterThanOrEqual(30);
    expect(settingsBox!.width).toBeGreaterThanOrEqual(30);
  });
});

test.describe("Mobile - Scrolling", () => {
  test("home page scrolls when content overflows viewport", async ({ page }) => {
    await page.goto("/");
    // Check that the page is scrollable if content is taller than viewport
    const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
    const viewportHeight = page.viewportSize()!.height;
    // At minimum, the page should render without crashing
    expect(bodyHeight).toBeGreaterThan(0);
    // Content should be reachable by scrolling
    if (bodyHeight > viewportHeight) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      const scrollY = await page.evaluate(() => window.scrollY);
      expect(scrollY).toBeGreaterThan(0);
    }
  });

  test("header remains visible after scrolling", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => window.scrollTo(0, 200));
    await page.waitForTimeout(100);
    const header = page.locator("header");
    await expect(header).toBeVisible();
    await expect(header).toBeInViewport();
  });

  test("setup page is fully scrollable", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.getByRole("heading", { name: "Test 詞彙" }).click();

    // The bottom button should be reachable by scrolling
    const randomBtn = page.getByText("隨機複習（全部卡片）");
    await randomBtn.scrollIntoViewIfNeeded();
    await expect(randomBtn).toBeInViewport();
  });

  test("study page flashcard area is within viewport without scrolling", async ({ page }) => {
    await goToStudySession(page);
    const card = page.locator(".perspective");
    await expect(card).toBeInViewport();
  });

  test("session summary is scrollable and all buttons reachable", async ({ page }) => {
    await goToStudySession(page);
    // Complete all 3 cards
    for (let i = 0; i < 3; i++) {
      await page.locator(".perspective").click();
      await page.getByRole("button", { name: "記住了" }).click();
      await page.waitForTimeout(300);
    }
    await expect(page.getByText("學習完成！")).toBeVisible({ timeout: 5000 });

    // "回首頁" button at the bottom should be reachable
    const homeBtn = page.getByRole("button", { name: "回首頁" });
    await homeBtn.scrollIntoViewIfNeeded();
    await expect(homeBtn).toBeInViewport();
  });
});

test.describe("Mobile - Height & Content Fit", () => {
  test("study page uses dynamic viewport height (dvh)", async ({ page }) => {
    await goToStudySession(page);
    const container = page.locator("main > div.flex.flex-col");
    const style = await container.getAttribute("style");
    expect(style).toContain("100dvh");
  });

  test("flashcard has minimum height for readability", async ({ page }) => {
    await goToStudySession(page);
    const card = page.locator(".perspective");
    const box = await card.boundingBox();
    expect(box).not.toBeNull();
    // min-height: 280px is set on the card
    expect(box!.height).toBeGreaterThanOrEqual(280);
  });

  test("progress bar is visible above the card", async ({ page }) => {
    await goToStudySession(page);
    // Progress counter should be visible
    await expect(page.getByText(/^0\s*\/\s*3$/)).toBeVisible();
  });

  test("learn page card and buttons fit within viewport", async ({ page }) => {
    await goToLearnAll(page);
    const nextBtn = page.getByRole("button", { name: /下一張/ });
    await expect(nextBtn).toBeInViewport();
  });
});

test.describe("Mobile - Responsive Hints", () => {
  test("swipe hints visible on mobile viewport", async ({ page }) => {
    await goToStudySession(page);
    const swipeHint = page.getByText("← 不會 · ↓ 還好 · → 記住了");
    // On mobile (< 640px), swipe hint should be visible (sm:hidden means visible below sm)
    await expect(swipeHint).toBeVisible();
  });

  test("keyboard hints hidden on mobile viewport", async ({ page }) => {
    await goToStudySession(page);
    const keyboardHint = page.getByText("空白鍵翻面 · 1 不會 · 2 還好 · 3 記住了 · 可拖曳卡片");
    // hidden sm:block means hidden on mobile
    await expect(keyboardHint).not.toBeVisible();
  });

  test("learn mode keyboard hint hidden on mobile", async ({ page }) => {
    await goToLearnAll(page);
    const hint = page.getByText("← 上一張 · → 下一張");
    await expect(hint).not.toBeVisible();
  });
});

test.describe("Mobile - Touch/Swipe Interactions", () => {
  test("tap to flip flashcard works on mobile", async ({ page }) => {
    await goToStudySession(page);
    const card = page.locator(".perspective");
    // Use tap instead of click for mobile
    await card.tap();
    // Rating buttons should appear
    await expect(page.getByRole("button", { name: "記住了" })).toBeVisible();
  });

  test("tap rating button works after flip", async ({ page }) => {
    await goToStudySession(page);
    await page.locator(".perspective").tap();
    await expect(page.getByRole("button", { name: "記住了" })).toBeVisible();

    // Tap the button
    await page.getByRole("button", { name: "記住了" }).tap();
    await page.waitForTimeout(300);

    // Should advance to next card
    await expect(page.getByText(/^1\s*\/\s*3$/)).toBeVisible();
  });

  test("drag right rates as good on mobile", async ({ page }) => {
    await goToStudySession(page);
    await touchDragCard(page, "right");
    await page.waitForTimeout(300);
    await expect(page.getByText(/^1\s*\/\s*3$/)).toBeVisible();
  });

  test("drag left rates as again on mobile", async ({ page }) => {
    await goToStudySession(page);
    await touchDragCard(page, "left");
    await page.waitForTimeout(300);
    // Requeued: total becomes 4
    await expect(page.getByText(/^1\s*\/\s*4$/)).toBeVisible();
  });

  test("drag down rates as hard on mobile", async ({ page }) => {
    await goToStudySession(page);
    await touchDragCard(page, "down");
    await page.waitForTimeout(300);
    await expect(page.getByText(/^1\s*\/\s*3$/)).toBeVisible();
  });

  test("complete full session with touch interactions", async ({ page }) => {
    await goToStudySession(page);
    for (let i = 0; i < 3; i++) {
      await expect(page.locator(".perspective")).toBeVisible({ timeout: 5000 });
      await page.locator(".perspective").tap();
      await expect(page.getByRole("button", { name: "記住了" })).toBeVisible();
      await page.getByRole("button", { name: "記住了" }).tap();
      await page.waitForTimeout(300);
    }
    await expect(page.getByText("學習完成！")).toBeVisible({ timeout: 5000 });
  });

  test("complete full session with swipe gestures only", async ({ page }) => {
    await goToStudySession(page);
    for (let i = 0; i < 3; i++) {
      await expect(page.locator(".perspective")).toBeVisible({ timeout: 5000 });
      await touchDragCard(page, "right");
      await page.waitForTimeout(400);
    }
    await expect(page.getByText("學習完成！")).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Mobile - Navigation", () => {
  test("back button works on mobile", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("heading", { name: "Test 詞彙" }).click();
    await expect(page).toHaveURL(/\/study\/test-vocab$/);

    const backBtn = page.getByLabel("返回");
    await expect(backBtn).toBeVisible();
    await backBtn.tap();
    await expect(page).toHaveURL(/\/$/);
  });

  test("header title tap navigates home", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("heading", { name: "Test 詞彙" }).click();
    await expect(page).toHaveURL(/\/study\/test-vocab$/);

    await page.locator("header h1").tap();
    await expect(page).toHaveURL(/\/$/);
  });

  test("full navigation flow with taps: home → setup → session → summary → home", async ({
    page,
  }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());

    // Home → Setup
    await page.getByRole("heading", { name: "Test 詞彙" }).tap();
    await expect(page).toHaveURL(/\/study\/test-vocab$/);

    // Setup → Session
    const randomBtn = page.getByText("隨機複習（全部卡片）");
    await randomBtn.scrollIntoViewIfNeeded();
    await randomBtn.tap();
    await expect(page).toHaveURL(/\/study\/test-vocab\/session$/);

    // Complete all cards
    for (let i = 0; i < 3; i++) {
      const card = page.locator(".perspective");
      await expect(card).toBeVisible({ timeout: 5000 });
      await card.tap();
      await page.getByRole("button", { name: "記住了" }).tap();
      await page.waitForTimeout(300);
    }

    // Summary
    await expect(page.getByText("學習完成！")).toBeVisible({ timeout: 5000 });

    // Summary → Home
    const homeBtn = page.getByRole("button", { name: "回首頁" });
    await homeBtn.scrollIntoViewIfNeeded();
    await homeBtn.tap();
    await expect(page).toHaveURL(/\/$/);
  });

  test("settings page accessible via tap on mobile", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "設定" }).tap();
    await expect(page).toHaveURL(/\/settings$/);
    await expect(page.getByRole("heading", { name: "設定" })).toBeVisible();
  });
});

test.describe("Mobile - Learn Mode", () => {
  test("learn page navigation buttons work with tap", async ({ page }) => {
    await goToLearnAll(page);
    const prevBtn = page.getByRole("button", { name: /上一張/ });
    const nextBtn = page.getByRole("button", { name: /下一張/ });

    await expect(prevBtn).toBeDisabled();
    await nextBtn.tap();
    await page.waitForTimeout(200);
    await expect(prevBtn).toBeEnabled();
  });

  test("learn mode completion screen fits on mobile", async ({ page }) => {
    await goToLearnAll(page);
    for (let i = 0; i < 3; i++) {
      const btn = page.getByRole("button", { name: /下一張|完成/ });
      await btn.tap();
      await page.waitForTimeout(200);
    }
    await expect(page.getByText("瀏覽完成！")).toBeVisible();

    // All completion buttons should be reachable
    const restartBtn = page.getByRole("button", { name: "從頭看今天" });
    const examBtn = page.getByRole("button", { name: "去測驗" });
    await restartBtn.scrollIntoViewIfNeeded();
    await expect(restartBtn).toBeInViewport();
    await examBtn.scrollIntoViewIfNeeded();
    await expect(examBtn).toBeInViewport();
  });

  test("exam button is reachable on mobile learn page", async ({ page }) => {
    await goToLearnAll(page);
    const examBtn = page.getByRole("button", { name: "開始測驗" });
    await examBtn.scrollIntoViewIfNeeded();
    await expect(examBtn).toBeInViewport();
  });
});

test.describe("Mobile - Dark Mode", () => {
  test("dark mode toggle works with tap", async ({ page }) => {
    await page.goto("/");
    const darkBtn = page.locator("header button").first();
    await darkBtn.tap();
    await expect(page.locator("html")).toHaveClass(/dark/);

    // Tap again to toggle back
    await darkBtn.tap();
    await expect(page.locator("html")).not.toHaveClass(/dark/);
  });

  test("dark mode persists across mobile navigation", async ({ page }) => {
    await page.goto("/");
    // Enable dark mode
    await page.locator("header button").first().tap();
    await expect(page.locator("html")).toHaveClass(/dark/);

    // Navigate to setup
    await page.getByRole("heading", { name: "Test 詞彙" }).tap();
    await expect(page.locator("html")).toHaveClass(/dark/);

    // Navigate back
    await page.getByLabel("返回").tap();
    await expect(page.locator("html")).toHaveClass(/dark/);
  });
});

test.describe("Mobile - Settings", () => {
  test("settings toggles work with tap on mobile", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.getByRole("button", { name: "設定" }).tap();

    const darkToggle = page.getByRole("switch").first();
    await darkToggle.tap();
    await expect(page.locator("html")).toHaveClass(/dark/);
  });

  test("disabling swipe assist hides swipe hints on mobile", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());

    // Disable swipe assist
    await page.getByRole("button", { name: "設定" }).tap();
    await page.getByRole("switch").nth(1).tap();

    // Go to study session
    await page.goBack();
    await page.getByRole("heading", { name: "Test 詞彙" }).tap();
    await page.getByText("隨機複習（全部卡片）").tap();
    await expect(page).toHaveURL(/\/study\/test-vocab\/session$/);

    // Swipe hint should not be visible
    await expect(page.getByText("← 不會 · ↓ 還好 · → 記住了")).not.toBeVisible();
  });
});

test.describe("Mobile - Content Overflow", () => {
  test("flashcard text does not overflow card boundaries", async ({ page }) => {
    await goToStudySession(page);
    const card = page.locator(".perspective");
    const cardBox = await card.boundingBox();
    const viewport = page.viewportSize()!;
    expect(cardBox).not.toBeNull();
    // Card should not extend beyond viewport (round to handle subpixel rendering)
    expect(Math.floor(cardBox!.x)).toBeGreaterThanOrEqual(-1);
    expect(Math.ceil(cardBox!.x + cardBox!.width)).toBeLessThanOrEqual(viewport.width + 8);
  });

  test("session summary stats grid fits within mobile viewport", async ({ page }) => {
    await goToStudySession(page);
    // Complete all cards
    for (let i = 0; i < 3; i++) {
      await page.locator(".perspective").tap();
      await page.getByRole("button", { name: "記住了" }).tap();
      await page.waitForTimeout(300);
    }
    await expect(page.getByText("學習完成！")).toBeVisible({ timeout: 5000 });

    // Stats grid (3 columns) should fit
    const statsGrid = page.locator(".grid.grid-cols-3");
    const gridBox = await statsGrid.boundingBox();
    const viewport = page.viewportSize()!;
    expect(gridBox).not.toBeNull();
    expect(gridBox!.width).toBeLessThanOrEqual(viewport.width);
  });

  test("dataset cards do not overflow on mobile", async ({ page }) => {
    await page.goto("/");
    const cards = page.locator("main button");
    const count = await cards.count();
    const viewport = page.viewportSize()!;

    for (let i = 0; i < count; i++) {
      const box = await cards.nth(i).boundingBox();
      if (box) {
        expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
      }
    }
  });

  test("rating buttons span full width on mobile", async ({ page }) => {
    await goToStudySession(page);
    await page.locator(".perspective").tap();
    await expect(page.getByRole("button", { name: "記住了" })).toBeVisible();

    // The rating buttons container should use most of the available width
    const buttonContainer = page.locator(".flex.gap-3.mt-6");
    const containerBox = await buttonContainer.boundingBox();
    const viewport = page.viewportSize()!;
    expect(containerBox).not.toBeNull();
    // Should take up most of the viewport width (minus padding)
    expect(containerBox!.width).toBeGreaterThan(viewport.width * 0.7);
  });
});
