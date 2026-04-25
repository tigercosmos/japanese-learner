import { test, expect } from "@playwright/test";
import grammarFixture from "./fixtures/test-grammar.json" with { type: "json" };
import vocabFixture from "./fixtures/test-vocab.json" with { type: "json" };

const SPEAK_LABEL_RE = /播放發音/;

const FIRST_GRAMMAR_ITEM = grammarFixture.data[0];
const FIRST_GRAMMAR_PATTERN = FIRST_GRAMMAR_ITEM.japanese;
const FIRST_GRAMMAR_EXAMPLE_COUNT = FIRST_GRAMMAR_ITEM.examples.length;

// Bracket-stripped versions of every fixture example (any one may be picked by random review)
const GRAMMAR_EXAMPLES_STRIPPED = grammarFixture.data.flatMap((g) =>
  g.examples.map((e) => e.sentence.replace(/[【】]/g, "")),
);
const GRAMMAR_PATTERNS = grammarFixture.data.map((g) => g.japanese);
const VOCAB_JAPANESE = vocabFixture.data.map((v) => v.japanese);

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

/** Locate speakers within the front face only (excludes the back face). */
function frontFaceSpeakers(page: Parameters<Parameters<typeof test>[1]>[0]) {
  return page.locator(".card-face:not(.card-back)").getByLabel(SPEAK_LABEL_RE);
}
function backFaceSpeakers(page: Parameters<Parameters<typeof test>[1]>[0]) {
  return page.locator(".card-face.card-back").getByLabel(SPEAK_LABEL_RE);
}

// ---------------------------------------------------------------------------

test.describe("Grammar pronunciation – example-to-chinese (front sentence)", () => {
  test("front has exactly one speaker; back has none", async ({ page }) => {
    await startGrammarSession(page, "example-to-chinese");
    await expect(frontFaceSpeakers(page)).toHaveCount(1);
    await expect(backFaceSpeakers(page)).toHaveCount(0);
  });

  test("clicking the front speaker speaks the bracket-stripped sentence with lang ja-JP", async ({
    page,
  }) => {
    await mockSpeechSynthesis(page);
    await startGrammarSession(page, "example-to-chinese");

    await frontFaceSpeakers(page).click();

    const spoken = await readSpoken(page);
    expect(spoken).toHaveLength(1);
    expect(spoken[0].lang).toBe("ja-JP");
    expect(spoken[0].text).not.toContain("【");
    expect(spoken[0].text).not.toContain("】");
    expect(GRAMMAR_EXAMPLES_STRIPPED).toContain(spoken[0].text);
  });

  test("clicking the front speaker does NOT flip the card", async ({ page }) => {
    await startGrammarSession(page, "example-to-chinese");

    await expect(page.getByRole("button", { name: "記住了" })).not.toBeVisible();
    await frontFaceSpeakers(page).click();
    await expect(page.getByRole("button", { name: "記住了" })).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------

test.describe("Grammar pronunciation – fill-in-grammar (back full sentence)", () => {
  test("front has no speaker (blanked sentence is not speakable); back has exactly one", async ({
    page,
  }) => {
    await startGrammarSession(page, "fill-in-grammar");
    await expect(frontFaceSpeakers(page)).toHaveCount(0);
    await expect(backFaceSpeakers(page)).toHaveCount(1);
  });

  test("clicking the back speaker speaks the bracket-stripped sentence", async ({ page }) => {
    await mockSpeechSynthesis(page);
    await startGrammarSession(page, "fill-in-grammar");
    await flipCard(page);

    await backFaceSpeakers(page).click();

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

    await backFaceSpeakers(page).click();
    await expect(page.getByRole("button", { name: "記住了" })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------

test.describe("Grammar pronunciation – grammar-to-chinese (no sentence speaker)", () => {
  test("front has no speaker; back also has none (only Chinese meaning)", async ({ page }) => {
    await startGrammarSession(page, "grammar-to-chinese");
    await expect(frontFaceSpeakers(page)).toHaveCount(0);
    await expect(backFaceSpeakers(page)).toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------

test.describe("Grammar pronunciation – chinese-to-grammar (pattern speaker on back)", () => {
  test("front has no speaker; back has one next to the grammar pattern", async ({ page }) => {
    await startGrammarSession(page, "chinese-to-grammar");
    await expect(frontFaceSpeakers(page)).toHaveCount(0);
    await expect(backFaceSpeakers(page)).toHaveCount(1);
  });

  test("clicking the back speaker speaks the grammar pattern", async ({ page }) => {
    await mockSpeechSynthesis(page);
    await startGrammarSession(page, "chinese-to-grammar");
    await flipCard(page);

    await backFaceSpeakers(page).click();

    const spoken = await readSpoken(page);
    expect(spoken).toHaveLength(1);
    expect(spoken[0].lang).toBe("ja-JP");
    expect(GRAMMAR_PATTERNS).toContain(spoken[0].text);
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

  test("one speaker for the pattern + one per example (computed from fixture)", async ({
    page,
  }) => {
    const expected = 1 + FIRST_GRAMMAR_EXAMPLE_COUNT;
    await expect(page.getByLabel(SPEAK_LABEL_RE)).toHaveCount(expected);
  });

  test("clicking the pattern speaker speaks the grammar pattern", async ({ page }) => {
    await mockSpeechSynthesis(page);
    await page.reload();

    const speakers = page.getByLabel(SPEAK_LABEL_RE);
    await expect(speakers.first()).toBeVisible();
    await speakers.first().click();

    const spoken = await readSpoken(page);
    expect(spoken).toHaveLength(1);
    expect(spoken[0].lang).toBe("ja-JP");
    expect(spoken[0].text).toBe(FIRST_GRAMMAR_PATTERN);
  });

  test("clicking the example speaker speaks the bracket-stripped example sentence", async ({
    page,
  }) => {
    await mockSpeechSynthesis(page);
    await page.reload();

    const speakers = page.getByLabel(SPEAK_LABEL_RE);
    // Speaker index 0 = pattern; 1..N = examples
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

    await expect(page.getByLabel(SPEAK_LABEL_RE)).toHaveCount(1);
  });

  test("clicking it speaks the Japanese word", async ({ page }) => {
    await mockSpeechSynthesis(page);
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.getByRole("heading", { name: "Test 詞彙" }).click();
    await page.getByText("學習模式（瀏覽全部卡片）").click();
    await page.getByRole("button", { name: "開始學習" }).click();

    await page.getByLabel(SPEAK_LABEL_RE).click();

    const spoken = await readSpoken(page);
    expect(spoken).toHaveLength(1);
    expect(spoken[0].lang).toBe("ja-JP");
    expect(VOCAB_JAPANESE).toContain(spoken[0].text);
  });
});

// ---------------------------------------------------------------------------

test.describe("Back-face a11y – the inactive face is inert", () => {
  test("before flip: back face has `inert`, front does not", async ({ page }) => {
    await startGrammarSession(page, "chinese-to-grammar");

    const frontInert = await page
      .locator(".card-face:not(.card-back)")
      .evaluate((el) => el.hasAttribute("inert"));
    const backInert = await page
      .locator(".card-face.card-back")
      .evaluate((el) => el.hasAttribute("inert"));

    expect(frontInert).toBe(false);
    expect(backInert).toBe(true);
  });

  test("after flip: front face has `inert`, back does not", async ({ page }) => {
    await startGrammarSession(page, "chinese-to-grammar");
    await flipCard(page);

    const frontInert = await page
      .locator(".card-face:not(.card-back)")
      .evaluate((el) => el.hasAttribute("inert"));
    const backInert = await page
      .locator(".card-face.card-back")
      .evaluate((el) => el.hasAttribute("inert"));

    expect(frontInert).toBe(true);
    expect(backInert).toBe(false);
  });
});
