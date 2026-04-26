import { describe, it, expect } from "vitest";
import {
  parseGrammarSentence,
  parseChunks,
  getHighlightedParts,
  getBlankParts,
  extractGrammarText,
  stripGrammarBrackets,
  toSpeechText,
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

  it("emits exactly one blank per 【】 even when furigana fragments the inside", () => {
    // 【{読んで|よんで}ください】 splits into two grammar parts in the parser
    // (because of the inner furigana). The fill-in quiz must still show ONE
    // blank for the whole bracket, not two.
    const result = getBlankParts("本を【{読んで|よんで}ください】");
    expect(result).toEqual([
      { text: "本を", isGrammar: false },
      { text: "____", isGrammar: true },
    ]);
  });

  it("collapses runs across multiple inner annotations", () => {
    const result = getBlankParts("A【{X|x}{Y|y}Z】B");
    expect(result).toEqual([
      { text: "A", isGrammar: false },
      { text: "____", isGrammar: true },
      { text: "B", isGrammar: false },
    ]);
  });

  it("emits TWO blanks for adjacent 【X】【Y】 with no separator", () => {
    // Regression: previous collapse-by-isGrammar logic merged adjacent
    // brackets into a single blank. The chunk-based parser must keep them
    // distinct so the fill-in quiz shows one blank per bracket.
    const result = getBlankParts("A【X】【Y】B");
    expect(result).toEqual([
      { text: "A", isGrammar: false },
      { text: "____", isGrammar: true },
      { text: "____", isGrammar: true },
      { text: "B", isGrammar: false },
    ]);
  });

  it("handles two adjacent annotated brackets", () => {
    const result = getBlankParts("【{知って|しって}いる】【かもしれない】");
    expect(result).toEqual([
      { text: "____", isGrammar: true },
      { text: "____", isGrammar: true },
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

describe("parseGrammarSentence — manual furigana annotations", () => {
  it("attaches reading to a single {kanji|reading} segment", () => {
    expect(parseGrammarSentence("{私|わたし}は学生です")).toEqual([
      { text: "私", reading: "わたし", isGrammar: false },
      { text: "は学生です", isGrammar: false },
    ]);
  });

  it("annotates multiple words and preserves the rest", () => {
    expect(parseGrammarSentence("{私|わたし}は{学生|がくせい}です")).toEqual([
      { text: "私", reading: "わたし", isGrammar: false },
      { text: "は", isGrammar: false },
      { text: "学生", reading: "がくせい", isGrammar: false },
      { text: "です", isGrammar: false },
    ]);
  });

  it("interleaves furigana and grammar 【】 markers", () => {
    expect(parseGrammarSentence("{私|わたし}【は】{学生|がくせい}【です】。")).toEqual([
      { text: "私", reading: "わたし", isGrammar: false },
      { text: "は", isGrammar: true },
      { text: "学生", reading: "がくせい", isGrammar: false },
      { text: "です", isGrammar: true },
      { text: "。", isGrammar: false },
    ]);
  });

  it("supports furigana inside a grammar bracket", () => {
    expect(parseGrammarSentence("【{知って|しって}いる】")).toEqual([
      { text: "知って", reading: "しって", isGrammar: true },
      { text: "いる", isGrammar: true },
    ]);
  });

  it("supports word-level annotations including okurigana", () => {
    expect(parseGrammarSentence("{食べる|たべる}のが好き")).toEqual([
      { text: "食べる", reading: "たべる", isGrammar: false },
      { text: "のが好き", isGrammar: false },
    ]);
  });

  it("ignores unmatched braces", () => {
    expect(parseGrammarSentence("{not a furigana}")).toEqual([
      { text: "{not a furigana}", isGrammar: false },
    ]);
  });
});

describe("stripGrammarBrackets", () => {
  it("removes 【】 but keeps {kanji|reading} intact for downstream rendering", () => {
    expect(stripGrammarBrackets("{私|わたし}【は】{学生|がくせい}【です】。"))
      .toBe("{私|わたし}は{学生|がくせい}です。");
  });

  it("returns text unchanged when there are no brackets", () => {
    expect(stripGrammarBrackets("普通の文")).toBe("普通の文");
  });
});

describe("parseChunks", () => {
  it("returns empty array for empty input", () => {
    expect(parseChunks("")).toEqual([]);
  });

  it("returns a single non-grammar chunk for plain text", () => {
    expect(parseChunks("普通の文")).toEqual([
      { isGrammar: false, parts: [{ text: "普通の文", isGrammar: false }] },
    ]);
  });

  it("emits separate grammar chunks for adjacent 【X】【Y】", () => {
    expect(parseChunks("A【X】【Y】B")).toEqual([
      { isGrammar: false, parts: [{ text: "A", isGrammar: false }] },
      { isGrammar: true, parts: [{ text: "X", isGrammar: true }] },
      { isGrammar: true, parts: [{ text: "Y", isGrammar: true }] },
      { isGrammar: false, parts: [{ text: "B", isGrammar: false }] },
    ]);
  });

  it("handles brackets at start and end with non-grammar in between", () => {
    expect(parseChunks("【X】mid【Y】")).toEqual([
      { isGrammar: true, parts: [{ text: "X", isGrammar: true }] },
      { isGrammar: false, parts: [{ text: "mid", isGrammar: false }] },
      { isGrammar: true, parts: [{ text: "Y", isGrammar: true }] },
    ]);
  });

  it("preserves inner furigana annotations as multiple parts within one chunk", () => {
    expect(parseChunks("【{知って|しって}いる】")).toEqual([
      {
        isGrammar: true,
        parts: [
          { text: "知って", reading: "しって", isGrammar: true },
          { text: "いる", isGrammar: true },
        ],
      },
    ]);
  });

  it("emits a chunk for an empty 【】 bracket", () => {
    expect(parseChunks("【】")).toEqual([
      { isGrammar: true, parts: [] },
    ]);
  });

  it("preserves furigana annotations in non-grammar text", () => {
    expect(parseChunks("{私|わたし}は学生")).toEqual([
      {
        isGrammar: false,
        parts: [
          { text: "私", reading: "わたし", isGrammar: false },
          { text: "は学生", isGrammar: false },
        ],
      },
    ]);
  });
});

describe("toSpeechText", () => {
  it("strips both 【】 and collapses {kanji|reading} to the kanji", () => {
    expect(toSpeechText("{私|わたし}【は】{学生|がくせい}【です】。"))
      .toBe("私は学生です。");
  });

  it("preserves a sentence with neither annotation type", () => {
    expect(toSpeechText("これは普通の文です。")).toBe("これは普通の文です。");
  });

  it("handles okurigana in the kanji portion", () => {
    expect(toSpeechText("{食べる|たべる}のが好き")).toBe("食べるのが好き");
  });
});

