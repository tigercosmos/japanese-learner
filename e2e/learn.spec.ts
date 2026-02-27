import { test, expect } from "@playwright/test";

// Helper: navigate to LearnSetupPage for a given dataset
async function goToLearnSetup(page: Parameters<Parameters<typeof test>[1]>[0], dataset: string) {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  const heading = dataset === "test-vocab" ? "Test 詞彙" : "Test 文法";
  await page.getByRole("heading", { name: heading }).click();
  await page.getByText("學習模式（瀏覽全部卡片）").click();
  await expect(page).toHaveURL(new RegExp(`/learn/${dataset}$`));
}

// Helper: navigate to LearnPage in "all at once" mode
async function goToLearnAll(page: Parameters<Parameters<typeof test>[1]>[0], dataset = "test-vocab") {
  await goToLearnSetup(page, dataset);
  // "全部學習" is the default selection
  await page.getByRole("button", { name: "開始學習" }).click();
  await expect(page).toHaveURL(new RegExp(`/learn/${dataset}/session$`));
}

test.describe("Learn Setup Page", () => {
  test("shows 全部學習 and 分天計畫 options", async ({ page }) => {
    await goToLearnSetup(page, "test-vocab");
    await expect(page.getByText("全部學習")).toBeVisible();
    await expect(page.getByText("分天計畫")).toBeVisible();
  });

  test("day selector shows cards-per-day calculation", async ({ page }) => {
    await goToLearnSetup(page, "test-vocab");
    await page.getByLabel("分天計畫").click();
    // 3 cards / 5 days → disabled (5 > 3), so pick 5-day which should be disabled
    // Just verify preview text appears after selecting a valid day count
    // For 3 cards, only 5 day option might be disabled; let's verify the preview renders
    await expect(page.getByText(/每天學/)).toBeVisible();
  });

  test("全部學習 navigates to session with all cards", async ({ page }) => {
    await goToLearnSetup(page, "test-vocab");
    // Default is 全部學習
    await page.getByRole("button", { name: "開始學習" }).click();
    await expect(page).toHaveURL(/\/learn\/test-vocab\/session$/);
  });

  test("分天計畫 navigates to session page", async ({ page }) => {
    await goToLearnSetup(page, "test-vocab");
    await page.getByLabel("分天計畫").click();
    await page.getByRole("button", { name: "開始學習" }).click();
    await expect(page).toHaveURL(/\/learn\/test-vocab\/session$/);
  });

  test("existing plan shows 繼續計畫 option", async ({ page }) => {
    await goToLearnSetup(page, "test-vocab");
    // Create a plan by selecting 分天計畫 and starting
    await page.getByLabel("分天計畫").click();
    await page.getByRole("button", { name: "開始學習" }).click();
    await expect(page).toHaveURL(/\/learn\/test-vocab\/session$/);
    // Go back to setup
    await page.goto("/");
    await page.getByRole("heading", { name: "Test 詞彙" }).click();
    await page.getByText("學習模式（瀏覽全部卡片）").click();
    await expect(page).toHaveURL(/\/learn\/test-vocab$/);
    // Should show resume option
    await expect(page.getByText("繼續計畫")).toBeVisible();
  });
});

test.describe("Learn Mode - Vocabulary", () => {
  test.beforeEach(async ({ page }) => {
    await goToLearnAll(page);
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
    await expect(page.getByRole("button", { name: "從頭看今天" })).toBeVisible();
    await expect(page.getByRole("button", { name: "去測驗" })).toBeVisible();
  });

  test("should restart from beginning", async ({ page }) => {
    // Go through all cards
    for (let i = 0; i < 3; i++) {
      const btn = page.getByRole("button", { name: /下一張|完成/ });
      await btn.click();
      await page.waitForTimeout(200);
    }

    // Click "從頭看今天"
    await page.getByRole("button", { name: "從頭看今天" }).click();

    // Should be back at first card
    await expect(page.getByRole("button", { name: /上一張/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /下一張/ })).toBeVisible();
  });

  test("should navigate to study session from completion", async ({ page }) => {
    for (let i = 0; i < 3; i++) {
      const btn = page.getByRole("button", { name: /下一張|完成/ });
      await btn.click();
      await page.waitForTimeout(200);
    }

    await page.getByRole("button", { name: "去測驗" }).click();
    await expect(page).toHaveURL(/\/study\/test-vocab\/session$/);
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

  test("should show 開始測驗 button during browsing", async ({ page }) => {
    await expect(page.getByRole("button", { name: "開始測驗" })).toBeVisible();
  });
});

test.describe("Learn Mode - Grammar", () => {
  test("should display grammar card with navigation", async ({ page }) => {
    await goToLearnAll(page, "test-grammar");
    await expect(page.getByRole("button", { name: /上一張/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /下一張/ })).toBeVisible();
  });
});

test.describe("Learn Mode - Daily Plan", () => {
  test.beforeEach(async ({ page }) => {
    await goToLearnSetup(page, "test-vocab");
    await page.getByLabel("分天計畫").click();
    // The default 5-day option is disabled for 3 cards; we need to manually create plan
    // Use localStorage to set a 2-day plan for 3-card fixture
    await page.evaluate(() => {
      const plan = {
        datasetId: "test-vocab",
        totalDays: 2,
        cardIds: [
          ["test-vocab-001", "test-vocab-002"],
          ["test-vocab-003"],
        ],
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem("jp-learner:study-plan-test-vocab", JSON.stringify(plan));
    });
    await page.goto(`/learn/test-vocab/session`);
    // Pass state via navigation from setup page
    await page.evaluate(() => {
      // Use history API to set state since Playwright can't pass React Router state directly
    });
    // Navigate with state by triggering the page setup
    await page.goto("/");
    await page.getByRole("heading", { name: "Test 詞彙" }).click();
    await page.getByText("學習模式（瀏覽全部卡片）").click();
    // Should show resume (plan already in localStorage)
    await page.getByRole("button", { name: "繼續計畫" }).click();
    await expect(page).toHaveURL(/\/learn\/test-vocab\/session$/);
  });

  test("day tabs are visible", async ({ page }) => {
    await expect(page.getByText("第 1 天")).toBeVisible();
    await expect(page.getByText("第 2 天")).toBeVisible();
  });

  test("開始測驗今天的卡片 button is visible", async ({ page }) => {
    await expect(page.getByRole("button", { name: "開始測驗今天的卡片" })).toBeVisible();
  });

  test("can click a future day tab to jump to that day", async ({ page }) => {
    // Click day 2 tab
    await page.getByRole("button", { name: /第 2 天/ }).click();
    await page.waitForTimeout(200);
    // Should show day 2's card (test-vocab-003: 食べる)
    await expect(page.getByText("食べる", { exact: true })).toBeVisible();
  });

  test("shows completion screen after all day cards", async ({ page }) => {
    // Day 1 has 2 cards — navigate through them
    for (let i = 0; i < 2; i++) {
      const btn = page.getByRole("button", { name: /下一張|完成/ });
      await btn.click();
      await page.waitForTimeout(200);
    }
    await expect(page.getByText("第 1 天完成！")).toBeVisible();
    await expect(page.getByText("已看完 2 張卡片")).toBeVisible();
  });

  test("completion screen shows 下一天 button when next day exists", async ({ page }) => {
    for (let i = 0; i < 2; i++) {
      const btn = page.getByRole("button", { name: /下一張|完成/ });
      await btn.click();
      await page.waitForTimeout(200);
    }
    await expect(page.getByRole("button", { name: /下一天/ })).toBeVisible();
  });

  test("clicking 測驗今天的卡片 navigates to study session", async ({ page }) => {
    await page.getByRole("button", { name: "開始測驗今天的卡片" }).click();
    await expect(page).toHaveURL(/\/study\/test-vocab\/session$/);
  });

  test("after exam 學習下一天 button appears in summary", async ({ page }) => {
    await page.getByRole("button", { name: "開始測驗今天的卡片" }).click();
    await expect(page).toHaveURL(/\/study\/test-vocab\/session$/);

    // Complete the study session (2 cards for day 1)
    for (let i = 0; i < 2; i++) {
      // Flip the card
      await page.locator(".card, [class*='card'], [class*='flashcard']").first().click();
      await page.waitForTimeout(300);
      // Rate as good
      await page.getByRole("button", { name: "記住了" }).click();
      await page.waitForTimeout(300);
    }

    // SessionSummary should show 學習下一天
    await expect(page.getByRole("button", { name: "學習下一天" })).toBeVisible();
  });
});
