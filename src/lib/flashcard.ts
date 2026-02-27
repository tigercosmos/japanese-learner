import type {
  VocabItem,
  GrammarItem,
  VocabTestMode,
  GrammarTestMode,
  FlashcardContent,
} from "../types";

/**
 * Build flashcard content for a vocabulary item based on the test mode.
 */
export function buildVocabCard(item: VocabItem, mode: VocabTestMode): FlashcardContent {
  if (mode === "random") {
    const concreteModes: VocabTestMode[] = ["kanji-to-chinese", "hiragana-to-chinese", "chinese-to-japanese"];
    return buildVocabCard(item, concreteModes[Math.floor(Math.random() * concreteModes.length)]);
  }
  switch (mode) {
    case "kanji-to-chinese":
      return {
        front: { primary: item.japanese },
        back: {
          primary: item.simple_chinese,
          secondary: item.hiragana,
          detail: item.full_explanation || undefined,
        },
      };
    case "hiragana-to-chinese":
      return {
        front: { primary: item.hiragana },
        back: {
          primary: item.simple_chinese,
          detail: item.full_explanation || undefined,
        },
      };
    case "chinese-to-japanese":
      return {
        front: { primary: item.simple_chinese },
        back: {
          primary: item.japanese,
          secondary: item.hiragana,
          detail: item.full_explanation || undefined,
        },
      };
    default:
      // Fallback for safety
      return {
        front: { primary: item.japanese },
        back: { primary: item.simple_chinese },
      };
  }
}

/**
 * Build flashcard content for a grammar item based on the test mode.
 * For example-based modes, picks a random example.
 */
export function buildGrammarCard(
  item: GrammarItem,
  mode: GrammarTestMode,
  exampleIndex?: number,
): FlashcardContent {
  if (mode === "random") {
    const concreteModes: GrammarTestMode[] = ["grammar-to-chinese", "example-to-chinese", "chinese-to-grammar", "fill-in-grammar"];
    return buildGrammarCard(item, concreteModes[Math.floor(Math.random() * concreteModes.length)], exampleIndex);
  }
  const example = item.examples?.[exampleIndex ?? 0];

  switch (mode) {
    case "grammar-to-chinese":
      return {
        front: { primary: item.japanese },
        back: {
          primary: item.simple_chinese,
          detail: item.full_explanation || undefined,
        },
      };

    case "example-to-chinese":
      return {
        front: {
          primary: example ? `__GRAMMAR_HIGHLIGHT__${example.sentence}` : item.japanese,
        },
        back: {
          primary: example?.chinese ?? item.simple_chinese,
          secondary: item.japanese + "：" + item.simple_chinese,
          detail: item.full_explanation || undefined,
        },
      };

    case "chinese-to-grammar":
      return {
        front: { primary: item.simple_chinese },
        back: {
          primary: item.japanese,
          detail: item.full_explanation || undefined,
        },
      };

    case "fill-in-grammar":
      return {
        front: {
          primary: example ? `__GRAMMAR_BLANK__${example.sentence}` : item.simple_chinese,
          secondary: example?.chinese,
        },
        back: {
          primary: item.japanese,
          secondary: example?.sentence.replace(/【/g, "").replace(/】/g, ""),
          detail: item.full_explanation || undefined,
        },
      };
    default:
      // Fallback for safety
      return {
        front: { primary: item.japanese },
        back: { primary: item.simple_chinese },
      };
  }
}
