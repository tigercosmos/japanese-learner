import { describe, it, expect } from "vitest";
import { buildVocabCard, buildGrammarCard } from "../flashcard";
import type { VocabItem, GrammarItem } from "../../types";

const sampleVocab: VocabItem = {
  id: "vocab-001",
  japanese: "経済",
  hiragana: "けいざい",
  simple_chinese: "經濟",
  full_explanation: "経済成長：經濟成長",
};

const sampleGrammar: GrammarItem = {
  id: "grammar-001",
  japanese: "うちに",
  simple_chinese: "在～過程中／趁～",
  full_explanation: "表示在某狀態持續期間做某事。",
  examples: [
    {
      sentence: "勉強している【うちに】眠くなった",
      chinese: "讀書讀著讀著就睏了",
    },
    {
      sentence: "若い【うちに】いろいろな経験をしたい",
      chinese: "趁年輕想做各種體驗",
    },
  ],
};

describe("buildVocabCard", () => {
  it("should build kanji-to-chinese card", () => {
    const card = buildVocabCard(sampleVocab, "kanji-to-chinese");
    expect(card.front.primary).toBe("経済");
    expect(card.back.primary).toBe("經濟");
    expect(card.back.secondary).toBe("けいざい");
    expect(card.back.detail).toBe("経済成長：經濟成長");
  });

  it("should build hiragana-to-chinese card", () => {
    const card = buildVocabCard(sampleVocab, "hiragana-to-chinese");
    expect(card.front.primary).toBe("けいざい");
    expect(card.back.primary).toBe("經濟");
    expect(card.back.secondary).toBeUndefined();
    expect(card.back.detail).toBe("経済成長：經濟成長");
  });

  it("should build chinese-to-japanese card", () => {
    const card = buildVocabCard(sampleVocab, "chinese-to-japanese");
    expect(card.front.primary).toBe("經濟");
    expect(card.back.primary).toBe("経済");
    expect(card.back.secondary).toBe("けいざい");
    expect(card.back.detail).toBe("経済成長：經濟成長");
  });

  it("should handle vocab with empty explanation", () => {
    const vocab: VocabItem = { ...sampleVocab, full_explanation: "" };
    const card = buildVocabCard(vocab, "kanji-to-chinese");
    expect(card.back.detail).toBeUndefined();
  });

  describe("pronunciation field", () => {
    it("kanji-to-chinese sets pronunciation to japanese word", () => {
      const card = buildVocabCard(sampleVocab, "kanji-to-chinese");
      expect(card.back.pronunciation).toBe("経済");
    });

    it("hiragana-to-chinese sets pronunciation to japanese word", () => {
      const card = buildVocabCard(sampleVocab, "hiragana-to-chinese");
      expect(card.back.pronunciation).toBe("経済");
    });

    it("chinese-to-japanese sets pronunciation equal to back.primary", () => {
      const card = buildVocabCard(sampleVocab, "chinese-to-japanese");
      expect(card.back.pronunciation).toBe("経済");
      expect(card.back.pronunciation).toBe(card.back.primary);
    });
  });
});

describe("buildGrammarCard", () => {
  it("should build grammar-to-chinese card", () => {
    const card = buildGrammarCard(sampleGrammar, "grammar-to-chinese");
    expect(card.front.primary).toBe("うちに");
    expect(card.back.primary).toBe("在～過程中／趁～");
    expect(card.back.detail).toBe("表示在某狀態持續期間做某事。");
  });

  it("should build example-to-chinese card with first example", () => {
    const card = buildGrammarCard(sampleGrammar, "example-to-chinese", 0);
    expect(card.front.primary).toContain("__GRAMMAR_HIGHLIGHT__");
    expect(card.front.primary).toContain("勉強している【うちに】眠くなった");
    expect(card.back.primary).toBe("讀書讀著讀著就睏了");
    expect(card.back.secondary).toBe("うちに：在～過程中／趁～");
  });

  it("should build example-to-chinese card with second example", () => {
    const card = buildGrammarCard(sampleGrammar, "example-to-chinese", 1);
    expect(card.front.primary).toContain("若い【うちに】いろいろな経験をしたい");
    expect(card.back.primary).toBe("趁年輕想做各種體驗");
  });

  it("should build chinese-to-grammar card", () => {
    const card = buildGrammarCard(sampleGrammar, "chinese-to-grammar");
    expect(card.front.primary).toBe("在～過程中／趁～");
    expect(card.back.primary).toBe("うちに");
  });

  it("should build fill-in-grammar card", () => {
    const card = buildGrammarCard(sampleGrammar, "fill-in-grammar", 0);
    expect(card.front.primary).toContain("__GRAMMAR_BLANK__");
    expect(card.front.secondary).toBe("讀書讀著讀著就睏了");
    expect(card.back.primary).toBe("うちに");
    // Back secondary should have brackets removed
    expect(card.back.secondary).toBe("勉強しているうちに眠くなった");
  });

  it("should handle grammar with empty explanation", () => {
    const grammar: GrammarItem = { ...sampleGrammar, full_explanation: "" };
    const card = buildGrammarCard(grammar, "grammar-to-chinese");
    expect(card.back.detail).toBeUndefined();
  });

  it("should handle grammar without examples for example-based mode", () => {
    const grammar: GrammarItem = { ...sampleGrammar, examples: [] };
    const card = buildGrammarCard(grammar, "example-to-chinese");
    // Falls back to japanese when no examples
    expect(card.front.primary).toContain(grammar.japanese);
  });

  it("grammar cards do not set pronunciation", () => {
    const modes: Parameters<typeof buildGrammarCard>[1][] = [
      "grammar-to-chinese",
      "example-to-chinese",
      "chinese-to-grammar",
      "fill-in-grammar",
    ];
    for (const mode of modes) {
      const card = buildGrammarCard(sampleGrammar, mode, 0);
      expect(card.back.pronunciation).toBeUndefined();
    }
  });
});
