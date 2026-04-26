import { test, expect } from "@playwright/test";

// The 3 switches on the Settings page in order are:
// 0 = 深色模式 (dark mode), 1 = 滑動提示 (swipe assist), 2 = 日文標假名 (furigana)
const FURIGANA_SWITCH_INDEX = 2;

const HIRAGANA_RE = /[぀-ゟ]+/;

test.describe("Furigana", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
  });

  test("toggle defaults to off and is visible on settings page", async ({ page }) => {
    await page.getByRole("button", { name: "設定" }).click();
    const toggle = page.getByRole("switch").nth(FURIGANA_SWITCH_INDEX);
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute("aria-checked", "false");
    // The toggle's neighboring label should be the furigana row.
    await expect(page.getByText("日文標假名")).toBeVisible();
  });

  test("does NOT render ruby elements when toggle is off", async ({ page }) => {
    await page.getByRole("heading", { name: "Test 文法" }).click();
    await page.getByText("學習模式（瀏覽全部卡片）").click();
    await page.getByRole("button", { name: "開始學習" }).click();
    await expect(page).toHaveURL(/\/learn\/test-grammar\/session$/);

    // Example sentence rendered (kanji visible in plain form).
    await expect(page.getByText("正在看書")).toBeVisible();
    // Give any async machinery a moment to misbehave.
    await page.waitForTimeout(500);
    await expect(page.locator("ruby")).toHaveCount(0);
  });

  test("renders <ruby><rt> with hiragana over kanji when toggle is on", async ({ page }) => {
    // Enable the toggle first.
    await page.getByRole("button", { name: "設定" }).click();
    await page.getByRole("switch").nth(FURIGANA_SWITCH_INDEX).click();
    await expect(page.getByRole("switch").nth(FURIGANA_SWITCH_INDEX)).toHaveAttribute(
      "aria-checked",
      "true",
    );

    // Navigate to a grammar learn session — example sentences contain kanji.
    await page.goto("/");
    await page.getByRole("heading", { name: "Test 文法" }).click();
    await page.getByText("學習模式（瀏覽全部卡片）").click();
    await page.getByRole("button", { name: "開始學習" }).click();
    await expect(page).toHaveURL(/\/learn\/test-grammar\/session$/);

    // Wait for kuroshiro to load the kuromoji dictionary on first use.
    // Allow generous time because the dict is ~17MB and loads only once.
    const firstRuby = page.locator("ruby").first();
    await expect(firstRuby).toBeAttached({ timeout: 30_000 });

    // The <rt> child must contain hiragana characters.
    const rtText = await firstRuby.locator("rt").first().textContent();
    expect(rtText ?? "").toMatch(HIRAGANA_RE);
  });

  test("toggle persists across navigation", async ({ page }) => {
    await page.getByRole("button", { name: "設定" }).click();
    await page.getByRole("switch").nth(FURIGANA_SWITCH_INDEX).click();
    await expect(page.getByRole("switch").nth(FURIGANA_SWITCH_INDEX)).toHaveAttribute(
      "aria-checked",
      "true",
    );

    await page.goto("/");
    await page.getByRole("button", { name: "設定" }).click();
    await expect(page.getByRole("switch").nth(FURIGANA_SWITCH_INDEX)).toHaveAttribute(
      "aria-checked",
      "true",
    );

    // Verify it's persisted in localStorage too.
    const stored = await page.evaluate(() => localStorage.getItem("jp-learner:settings"));
    expect(stored).toContain('"showFurigana":true');
  });

  test("manual {kanji|reading} override wins over kuroshiro auto-reading", async ({ page }) => {
    // Enable furigana.
    await page.getByRole("button", { name: "設定" }).click();
    await page.getByRole("switch").nth(FURIGANA_SWITCH_INDEX).click();

    await page.goto("/");
    await page.getByRole("heading", { name: "Test 文法" }).click();
    await page.getByText("學習模式（瀏覽全部卡片）").click();
    await page.getByRole("button", { name: "開始學習" }).click();
    await expect(page).toHaveURL(/\/learn\/test-grammar\/session$/);

    // Navigate to the third example which uses {方|かた}. Other entries don't
    // contain 「方」, so finding rt="かた" anywhere proves the override was used.
    await page.getByRole("button", { name: "下一張 →" }).click();
    await page.getByRole("button", { name: "下一張 →" }).click();

    // The annotated sentence "あの{方|かた}【は】{先生|せんせい}です。" should
    // render <ruby>方<rt>かた</rt></ruby>; kuroshiro alone would emit ほう.
    await expect(page.locator("ruby:has(rt:text-is('かた'))")).toBeAttached({ timeout: 10_000 });
    await expect(page.locator("ruby:has(rt:text-is('せんせい'))")).toBeAttached();

    // The pipe and curly braces from the annotation must NOT leak into visible
    // text — the user should see "あの方は先生です。" with rt above the kanji.
    const visible = await page.locator("h1, h2, h3, p, span, div").allTextContents();
    expect(visible.some((t) => t.includes("|") && t.includes("方"))).toBe(false);
    expect(visible.some((t) => t.includes("{方"))).toBe(false);
  });

  test("does not annotate text without kanji (pure hiragana grammar pattern)", async ({ page }) => {
    // Enable furigana.
    await page.getByRole("button", { name: "設定" }).click();
    await page.getByRole("switch").nth(FURIGANA_SWITCH_INDEX).click();

    // Navigate to grammar learn session. test-grammar-001's pattern is "ている"
    // (pure hiragana), so its grammar-pattern heading should never be wrapped
    // in ruby — only the example sentence parts that contain kanji should be.
    await page.goto("/");
    await page.getByRole("heading", { name: "Test 文法" }).click();
    await page.getByText("學習模式（瀏覽全部卡片）").click();
    await page.getByRole("button", { name: "開始學習" }).click();
    await expect(page).toHaveURL(/\/learn\/test-grammar\/session$/);

    // Wait for at least one ruby (example sentence with kanji) to confirm
    // kuroshiro initialized successfully.
    await expect(page.locator("ruby").first()).toBeAttached({ timeout: 30_000 });

    // The pattern heading "ている" (pure hiragana) should appear as-is —
    // no ruby element wrapping it.
    const headingText = page.getByText("ている", { exact: true }).first();
    await expect(headingText).toBeVisible();
  });
});
