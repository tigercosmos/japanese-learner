import { describe, it, expect } from "vitest";
import {
  parseGrammarSentence,
  getHighlightedParts,
  getBlankParts,
  extractGrammarText,
} from "../grammar";

describe("parseGrammarSentence", () => {
  it("should parse a single bracket notation", () => {
    const result = parseGrammarSentence("勉強している【うちに】眠くなった");
    expect(result).toEqual([
      { text: "勉強している", isGrammar: false },
      { text: "うちに", isGrammar: true },
      { text: "眠くなった", isGrammar: false },
    ]);
  });

  it("should parse multiple brackets", () => {
    const result = parseGrammarSentence("東京【から】大阪【にかけて】雨が降るでしょう");
    expect(result).toEqual([
      { text: "東京", isGrammar: false },
      { text: "から", isGrammar: true },
      { text: "大阪", isGrammar: false },
      { text: "にかけて", isGrammar: true },
      { text: "雨が降るでしょう", isGrammar: false },
    ]);
  });

  it("should handle bracket at the start", () => {
    const result = parseGrammarSentence("【ようにする】ことが大切");
    expect(result).toEqual([
      { text: "ようにする", isGrammar: true },
      { text: "ことが大切", isGrammar: false },
    ]);
  });

  it("should handle bracket at the end", () => {
    const result = parseGrammarSentence("毎日運動する【ようにする】");
    expect(result).toEqual([
      { text: "毎日運動する", isGrammar: false },
      { text: "ようにする", isGrammar: true },
    ]);
  });

  it("should handle sentence without brackets", () => {
    const result = parseGrammarSentence("これは普通の文です");
    expect(result).toEqual([
      { text: "これは普通の文です", isGrammar: false },
    ]);
  });

  it("should handle empty string", () => {
    const result = parseGrammarSentence("");
    expect(result).toEqual([]);
  });

  it("should handle consecutive brackets (ば...ほど pattern)", () => {
    const result = parseGrammarSentence("練習すれ【ば】する【ほど】上手になる");
    expect(result).toEqual([
      { text: "練習すれ", isGrammar: false },
      { text: "ば", isGrammar: true },
      { text: "する", isGrammar: false },
      { text: "ほど", isGrammar: true },
      { text: "上手になる", isGrammar: false },
    ]);
  });
});

describe("getHighlightedParts", () => {
  it("should return same result as parseGrammarSentence", () => {
    const sentence = "勉強している【うちに】眠くなった";
    expect(getHighlightedParts(sentence)).toEqual(parseGrammarSentence(sentence));
  });
});

describe("getBlankParts", () => {
  it("should replace grammar parts with blanks", () => {
    const result = getBlankParts("勉強している【うちに】眠くなった");
    expect(result).toEqual([
      { text: "勉強している", isGrammar: false },
      { text: "____", isGrammar: true },
      { text: "眠くなった", isGrammar: false },
    ]);
  });

  it("should replace multiple grammar parts with blanks", () => {
    const result = getBlankParts("東京【から】大阪【にかけて】雨が降るでしょう");
    expect(result).toEqual([
      { text: "東京", isGrammar: false },
      { text: "____", isGrammar: true },
      { text: "大阪", isGrammar: false },
      { text: "____", isGrammar: true },
      { text: "雨が降るでしょう", isGrammar: false },
    ]);
  });
});

describe("extractGrammarText", () => {
  it("should extract single grammar text", () => {
    expect(extractGrammarText("勉強している【うちに】眠くなった")).toBe("うちに");
  });

  it("should concatenate multiple grammar texts", () => {
    expect(extractGrammarText("東京【から】大阪【にかけて】雨が降るでしょう")).toBe("からにかけて");
  });

  it("should return empty string for no brackets", () => {
    expect(extractGrammarText("これは普通の文です")).toBe("");
  });
});
