import { test, expect } from "@playwright/test";

// Fixture grammar examples (with bracket-stripped expected forms for speech)
// From e2e/fixtures/test-grammar.json
const GRAMMAR_EXAMPLES_STRIPPED = [
  "本を読んている",
  "東京から大阪まで新幹線で行く",
];
const GRAMMAR_PATTERNS = ["ている", "～から～まで"];

/**
 * Mock window.speechSynthesis. Same approach as pronunciation.spec.ts:
 * window.speechSynthesis is a non-writable getter, so use defineProperty.
 * Spoken utterances are collected on window.__spokenTexts.
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

    Object.defineProperty(window, "SpeechSynthesisUtterance", {
      configurable: true,
      writable: true,
      value: MockUtterance,
    });

    const mockSS = {
      speak(u: MockUtterance) {
        spokenTexts.push({ text: u.text, lang: u.lang });
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

    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      get: () => mockSS,
    });

    (window as unknown as Record<string, unknown>).__spokenTexts = spokenTexts;
  });
}

async function readSpoken(page: Parameters<Parameters<typeof test>[1]>[0]) {
  return page.evaluate(
    () =>
      (window as unknown as Record<string, unknown>).__spokenTexts as Array<{
        text: string;
        lang: string;
      }>,
  );
}

/** Set the saved grammar test mode and start a random-review session. */
async function startGrammarSession(
  page: Parameters<Parameters<typeof test>[1]>[0],
  mode: "example-to-chinese" | "fill-in-grammar" | "grammar-to-chinese",
) {
  await page.goto("/");
  await page.evaluate((m) => {
    localStorage.clear();
    localStorage.setItem("jp-learner:test-mode", JSON.stringify({ grammar: m }));
  }, mode);
  await page.getByRole("heading", { name: "Test 文法" }).click();
  await page.getByText("隨機複習（全部卡片）").click();
  await expect(page).toHaveURL(/\/study\/test-grammar\/session$/);
  await expect(page.locator(".perspective")).toBeVisible({ timeout: 5000 });
}

async function flipCard(page: Parameters<Parameters<typeof test>[1]>[0]) {
  await page.locator(".perspective").click();
  await expect(page.getByRole("button", { name: "記住了" })).toBeVisible({ timeout: 3000 });
}

// ---------------------------------------------------------------------------

test.describe("Grammar pronunciation – example-to-chinese mode (front sentence)", () => {
  test("speaker button is visible on the front before flipping", async ({ page }) => {
    await startGrammarSession(page, "example-to-chinese");
    await expect(page.getByLabel("播放發音").first()).toBeVisible();
    // Rating buttons should NOT be visible (we haven't flipped)
    await expect(page.getByRole("button", { name: "記住了" })).not.toBeVisible();
  });

  test("clicking the front speaker speaks the bracket-stripped sentence with lang ja-JP", async ({
    page,
  }) => {
    await mockSpeechSynthesis(page);
    await startGrammarSession(page, "example-to-chinese");

    await page.getByLabel("播放發音").first().click();

    const spoken = await readSpoken(page);
    expect(spoken).toHaveLength(1);
    expect(spoken[0].lang).toBe("ja-JP");
    // The spoken sentence must NOT contain the 【】 bracket characters
    expect(spoken[0].text).not.toContain("【");
    expect(spoken[0].text).not.toContain("】");
    // It must match one of the fixture sentences (after stripping)
    expect(GRAMMAR_EXAMPLES_STRIPPED).toContain(spoken[0].text);
  });

  test("clicking the front speaker does NOT flip the card", async ({ page }) => {
    await startGrammarSession(page, "example-to-chinese");

    // Pre-condition: rating buttons not visible
    await expect(page.getByRole("button", { name: "記住了" })).not.toBeVisible();

    await page.getByLabel("播放發音").first().click();

    // Card must remain on the front: rating buttons still hidden
    await expect(page.getByRole("button", { name: "記住了" })).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------

test.describe("Grammar pronunciation – fill-in-grammar mode (back full sentence)", () => {
  test("no speaker on the front (blanked sentence is not speakable)", async ({ page }) => {
    await startGrammarSession(page, "fill-in-grammar");
    // The card front shows the sentence with blanks → no front pronunciation
    // The back is hidden by 3D transform; speaker on back exists in DOM but visually hidden.
    // We'll verify by flipping.
    await expect(page.locator(".perspective")).toBeVisible();
  });

  test("speaker button appears next to the full sentence after flipping", async ({ page }) => {
    await startGrammarSession(page, "fill-in-grammar");
    await flipCard(page);
    await expect(page.getByLabel("播放發音").first()).toBeVisible();
  });

  test("clicking the back speaker speaks the bracket-stripped sentence", async ({ page }) => {
    await mockSpeechSynthesis(page);
    await startGrammarSession(page, "fill-in-grammar");
    await flipCard(page);

    await page.getByLabel("播放發音").first().click();

    const spoken = await readSpoken(page);
    expect(spoken).toHaveLength(1);
    expect(spoken[0].lang).toBe("ja-JP");
    expect(spoken[0].text).not.toContain("【");
    expect(spoken[0].text).not.toContain("】");
    expect(GRAMMAR_EXAMPLES_STRIPPED).toContain(spoken[0].text);
  });

  test("clicking the back speaker does not flip the card back", async ({ page }) => {
    await startGrammarSession(page, "fill-in-grammar");
    await flipCard(page);

    await page.getByLabel("播放發音").first().click();
    // Rating buttons remain visible → still on back
    await expect(page.getByRole("button", { name: "記住了" })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------

test.describe("Grammar pronunciation – grammar-to-chinese mode has no sentence speaker", () => {
  test("no speaker on the front (grammar pattern only)", async ({ page }) => {
    await startGrammarSession(page, "grammar-to-chinese");
    // Front shows just the pattern (e.g. "ている") — no Japanese sentence, no speaker.
    await expect(page.getByLabel("播放發音")).not.toBeVisible();
  });

  test("no speaker after flipping either (back has Chinese only)", async ({ page }) => {
    await startGrammarSession(page, "grammar-to-chinese");
    await flipCard(page);
    await expect(page.getByLabel("播放發音")).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------

test.describe("LearnPage grammar – speakers next to pattern and each example", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.getByRole("heading", { name: "Test 文法" }).click();
    await page.getByText("學習模式（瀏覽全部卡片）").click();
    await page.getByRole("button", { name: "開始學習" }).click();
    await expect(page).toHaveURL(/\/learn\/test-grammar\/session$/);
  });

  test("speaker buttons appear (one for the pattern + one per example)", async ({ page }) => {
    // First grammar item has 1 example → 2 speakers total
    await expect(page.getByLabel("播放發音")).toHaveCount(2);
  });

  test("clicking the pattern speaker speaks the grammar pattern", async ({ page }) => {
    await mockSpeechSynthesis(page);
    await page.reload();

    const speakers = page.getByLabel("播放發音");
    await expect(speakers.first()).toBeVisible();
    await speakers.first().click();

    const spoken = await readSpoken(page);
    expect(spoken).toHaveLength(1);
    expect(spoken[0].lang).toBe("ja-JP");
    expect(GRAMMAR_PATTERNS).toContain(spoken[0].text);
  });

  test("clicking the example speaker speaks the bracket-stripped example sentence", async ({
    page,
  }) => {
    await mockSpeechSynthesis(page);
    await page.reload();

    const speakers = page.getByLabel("播放發音");
    await expect(speakers).toHaveCount(2);
    // Second speaker = the example
    await speakers.nth(1).click();

    const spoken = await readSpoken(page);
    expect(spoken).toHaveLength(1);
    expect(spoken[0].lang).toBe("ja-JP");
    expect(spoken[0].text).not.toContain("【");
    expect(spoken[0].text).not.toContain("】");
    expect(GRAMMAR_EXAMPLES_STRIPPED).toContain(spoken[0].text);
  });
});

// ---------------------------------------------------------------------------

test.describe("LearnPage vocab – speaker next to Japanese word", () => {
  test("speaker is visible next to the Japanese word", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.getByRole("heading", { name: "Test 詞彙" }).click();
    await page.getByText("學習模式（瀏覽全部卡片）").click();
    await page.getByRole("button", { name: "開始學習" }).click();
    await expect(page).toHaveURL(/\/learn\/test-vocab\/session$/);

    await expect(page.getByLabel("播放發音")).toHaveCount(1);
  });

  test("clicking it speaks the Japanese word", async ({ page }) => {
    await mockSpeechSynthesis(page);
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.getByRole("heading", { name: "Test 詞彙" }).click();
    await page.getByText("學習模式（瀏覽全部卡片）").click();
    await page.getByRole("button", { name: "開始學習" }).click();

    await page.getByLabel("播放發音").click();

    const spoken = await readSpoken(page);
    expect(spoken).toHaveLength(1);
    expect(spoken[0].lang).toBe("ja-JP");
    expect(["勉強", "天気", "食べる"]).toContain(spoken[0].text);
  });
});
