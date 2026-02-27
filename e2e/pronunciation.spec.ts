import { test, expect } from "@playwright/test";

// Fixture vocab Japanese words
const FIXTURE_JAPANESE = ["勉強", "天気", "食べる"];

/**
 * Mock window.speechSynthesis via Object.defineProperty (required because
 * window.speechSynthesis is a non-writable getter in Chrome — direct assignment
 * silently fails). Collects spoken items in window.__spokenTexts.
 */
async function mockSpeechSynthesis(page: Parameters<Parameters<typeof test>[1]>[0]) {
  await page.addInitScript(() => {
    const spokenTexts: Array<{ text: string; lang: string }> = [];

    class MockUtterance {
      text: string;
      lang = "";
      onstart: ((e: Event) => void) | null = null;
      onend: ((e: Event) => void) | null = null;
      onerror: ((e: Event) => void) | null = null;
      constructor(t: string) {
        this.text = t;
      }
    }

    // Override SpeechSynthesisUtterance constructor
    Object.defineProperty(window, "SpeechSynthesisUtterance", {
      configurable: true,
      writable: true,
      value: MockUtterance,
    });

    const mockSS = {
      speak(u: MockUtterance) {
        spokenTexts.push({ text: u.text, lang: u.lang });
        // Fire onstart quickly; keep onend delayed so speaking-state CSS can be checked
        setTimeout(() => u.onstart?.(new Event("start")), 10);
        setTimeout(() => u.onend?.(new Event("end")), 2000);
      },
      cancel() {},
      pause() {},
      resume() {},
      getVoices: () => [],
      paused: false,
      pending: false,
      speaking: false,
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => true,
      onvoiceschanged: null,
    };

    // Must use defineProperty because window.speechSynthesis is a getter in Chrome
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      get: () => mockSS,
    });

    (window as unknown as Record<string, unknown>).__spokenTexts = spokenTexts;
  });
}

/** Navigate to a random-review session for test-vocab (kanji-to-chinese default). */
async function startVocabSession(page: Parameters<Parameters<typeof test>[1]>[0]) {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.getByRole("heading", { name: "Test 詞彙" }).click();
  await page.getByText("隨機複習（全部卡片）").click();
  await expect(page).toHaveURL(/\/study\/test-vocab\/session$/);
}

/** Flip the current card and wait for rating buttons to appear (confirms flip succeeded). */
async function flipCard(page: Parameters<Parameters<typeof test>[1]>[0]) {
  const card = page.locator(".perspective");
  await expect(card).toBeVisible({ timeout: 5000 });
  await card.click();
  // Rating buttons appear only after flip — use as a reliable flip signal
  await expect(page.getByRole("button", { name: "記住了" })).toBeVisible({ timeout: 3000 });
}

// ---------------------------------------------------------------------------

test.describe("Pronunciation – card state before/after flip", () => {
  test("rating buttons are hidden before flip, visible after flip", async ({ page }) => {
    await startVocabSession(page);

    // Before flip: RatingButtons renders null when visible={false}
    await expect(page.getByRole("button", { name: "記住了" })).not.toBeVisible();

    // Flip
    await page.locator(".perspective").click();

    // After flip: rating buttons appear
    await expect(page.getByRole("button", { name: "記住了" })).toBeVisible();
  });

  test("speaker button appears after flipping in kanji-to-chinese mode", async ({ page }) => {
    await startVocabSession(page);
    await flipCard(page);
    await expect(page.getByLabel("播放發音")).toBeVisible();
  });

  test("speaker button appears after flipping in chinese-to-japanese mode", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem(
        "jp-learner:test-mode",
        JSON.stringify({ vocabulary: "chinese-to-japanese" }),
      );
    });
    await page.getByRole("heading", { name: "Test 詞彙" }).click();
    await page.getByText("隨機複習（全部卡片）").click();
    await flipCard(page);
    await expect(page.getByLabel("播放發音")).toBeVisible();
  });
});

// ---------------------------------------------------------------------------

test.describe("Pronunciation – speech synthesis integration", () => {
  test.beforeEach(async ({ page }) => {
    await mockSpeechSynthesis(page);
    await startVocabSession(page);
  });

  test("clicking speaker calls speechSynthesis.speak with lang ja-JP", async ({ page }) => {
    await flipCard(page);
    await page.getByLabel("播放發音").click();

    const spoken = await page.evaluate(
      () =>
        (window as unknown as Record<string, unknown>).__spokenTexts as Array<{
          text: string;
          lang: string;
        }>,
    );
    expect(spoken).toHaveLength(1);
    expect(spoken[0].lang).toBe("ja-JP");
  });

  test("spoken text is the Japanese word from the fixture", async ({ page }) => {
    await flipCard(page);
    await page.getByLabel("播放發音").click();

    const spoken = await page.evaluate(
      () =>
        (window as unknown as Record<string, unknown>).__spokenTexts as Array<{
          text: string;
          lang: string;
        }>,
    );
    expect(spoken).toHaveLength(1);
    expect(FIXTURE_JAPANESE).toContain(spoken[0].text);
  });

  test("clicking speaker button does NOT flip the card back", async ({ page }) => {
    await flipCard(page);

    // Rating buttons confirm we are on the back face
    await expect(page.getByRole("button", { name: "記住了" })).toBeVisible();

    await page.getByLabel("播放發音").click();

    // Card must remain flipped — rating buttons still visible
    await expect(page.getByRole("button", { name: "記住了" })).toBeVisible();
  });

  test("speaker button turns blue while speaking", async ({ page }) => {
    await flipCard(page);

    const btn = page.getByLabel("播放發音");
    await expect(btn).toBeVisible();

    // Not speaking yet — no blue styling
    await expect(btn).not.toHaveClass(/text-blue-500/);

    await btn.click();

    // onstart fires after ~10 ms → setSpeaking(true) → class update
    await expect(btn).toHaveClass(/text-blue-500/, { timeout: 500 });
  });
});

// ---------------------------------------------------------------------------

test.describe("Pronunciation – Japanese word on back face", () => {
  test("kanji-to-chinese: Japanese word is visible on card back alongside the speaker button", async ({
    page,
  }) => {
    await startVocabSession(page);

    // Click through all 3 cards and verify each back face has a Japanese word
    for (let i = 0; i < 3; i++) {
      await flipCard(page);

      // The pronunciation row: a span sibling to the speaker button
      const speakBtn = page.getByLabel("播放發音");
      await expect(speakBtn).toBeVisible();

      const pronunciationSpan = speakBtn.locator("..").locator("span");
      const japaneseText = await pronunciationSpan.textContent();
      expect(FIXTURE_JAPANESE).toContain(japaneseText?.trim());

      await page.getByRole("button", { name: "記住了" }).click();
      await page.waitForTimeout(300);
    }
  });

  test("chinese-to-japanese: speaker button is in the same row as the primary Japanese word", async ({
    page,
  }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem(
        "jp-learner:test-mode",
        JSON.stringify({ vocabulary: "chinese-to-japanese" }),
      );
    });
    await page.getByRole("heading", { name: "Test 詞彙" }).click();
    await page.getByText("隨機複習（全部卡片）").click();

    await flipCard(page);

    const speakBtn = page.getByLabel("播放發音");
    await expect(speakBtn).toBeVisible();

    // The parent flex row should contain the Japanese word
    const rowText = await speakBtn.locator("..").textContent();
    const matched = FIXTURE_JAPANESE.some((w) => rowText?.includes(w));
    expect(matched).toBe(true);
  });
});
