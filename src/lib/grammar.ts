export interface GrammarPart {
  text: string;
  isGrammar: boolean;
  /** Manually-annotated furigana reading from `{kanji|reading}` syntax. */
  reading?: string;
}

// `*` (not `+`) so a literal `【】` with no inner text is still recognized
// as an empty grammar bracket rather than silently rendered as plain text.
const GRAMMAR_RE = /【([^】]*)】/g;
const FURIGANA_RE = /\{([^|{}]+)\|([^}]+)\}/g;

/**
 * Parse a sentence with `【bracket】` and `{kanji|reading}` notation into parts.
 *
 * - `【...】` marks grammar segments (highlight target / fill-in target).
 * - `{kanji|reading}` provides a manual furigana reading; the renderer uses
 *   it directly and skips the kuroshiro auto-fallback for that segment.
 *
 * Both annotations may interleave or nest in any order; e.g.,
 * `{私|わたし}は{学生|がくせい}【です】。`
 *  → [
 *      { text: "私",   reading: "わたし", isGrammar: false },
 *      { text: "は",                       isGrammar: false },
 *      { text: "学生", reading: "がくせい", isGrammar: false },
 *      { text: "です",                     isGrammar: true  },
 *      { text: "。",                       isGrammar: false },
 *    ]
 */
export function parseGrammarSentence(sentence: string): GrammarPart[] {
  const out: GrammarPart[] = [];
  GRAMMAR_RE.lastIndex = 0;
  let last = 0;
  let m: RegExpExecArray | null;

  while ((m = GRAMMAR_RE.exec(sentence)) !== null) {
    if (m.index > last) {
      pushFurigana(out, sentence.slice(last, m.index), false);
    }
    pushFurigana(out, m[1], true);
    last = GRAMMAR_RE.lastIndex;
  }
  if (last < sentence.length) {
    pushFurigana(out, sentence.slice(last), false);
  }
  return out;
}

function pushFurigana(out: GrammarPart[], segment: string, isGrammar: boolean): void {
  FURIGANA_RE.lastIndex = 0;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = FURIGANA_RE.exec(segment)) !== null) {
    if (m.index > last) {
      out.push({ text: segment.slice(last, m.index), isGrammar });
    }
    out.push({ text: m[1], reading: m[2], isGrammar });
    last = FURIGANA_RE.lastIndex;
  }
  if (last < segment.length) {
    out.push({ text: segment.slice(last), isGrammar });
  }
}

/**
 * A `Chunk` represents either one `【...】` bracket or a contiguous run of
 * non-grammar text. The renderer uses chunks (rather than individual parts)
 * so a bracket containing inner furigana stays one visual unit, while two
 * adjacent brackets `【X】【Y】` stay two separate units.
 */
export interface SentenceChunk {
  isGrammar: boolean;
  parts: GrammarPart[];
}

/** Parse a sentence into bracket-aware chunks. */
export function parseChunks(sentence: string): SentenceChunk[] {
  const chunks: SentenceChunk[] = [];
  GRAMMAR_RE.lastIndex = 0;
  let last = 0;
  let m: RegExpExecArray | null;

  while ((m = GRAMMAR_RE.exec(sentence)) !== null) {
    if (m.index > last) {
      const parts: GrammarPart[] = [];
      pushFurigana(parts, sentence.slice(last, m.index), false);
      if (parts.length > 0) chunks.push({ isGrammar: false, parts });
    }
    const grammarParts: GrammarPart[] = [];
    pushFurigana(grammarParts, m[1], true);
    chunks.push({ isGrammar: true, parts: grammarParts });
    last = GRAMMAR_RE.lastIndex;
  }
  if (last < sentence.length) {
    const parts: GrammarPart[] = [];
    pushFurigana(parts, sentence.slice(last), false);
    if (parts.length > 0) chunks.push({ isGrammar: false, parts });
  }
  return chunks;
}

/** Render sentence with grammar parts highlighted (returns parts for React rendering). */
export function getHighlightedParts(sentence: string): GrammarPart[] {
  return parseGrammarSentence(sentence);
}

/**
 * Render sentence with each `【...】` bracket replaced by a single `____`
 * blank — even when a bracket contains inner `{kanji|reading}` annotations
 * (which would otherwise fragment it into multiple parts) and even when two
 * brackets are adjacent (`【X】【Y】` → two blanks, not one merged blank).
 */
export function getBlankParts(sentence: string): GrammarPart[] {
  const out: GrammarPart[] = [];
  for (const chunk of parseChunks(sentence)) {
    if (chunk.isGrammar) {
      out.push({ text: "____", isGrammar: true });
    } else {
      out.push(...chunk.parts);
    }
  }
  return out;
}

/** Extract just the grammar text from `【】` brackets (readings stripped). */
export function extractGrammarText(sentence: string): string {
  return parseGrammarSentence(sentence)
    .filter((p) => p.isGrammar)
    .map((p) => p.text)
    .join("");
}

/**
 * Strip `【】` brackets, keeping the inner text. Does NOT touch furigana
 * `{|}` annotations — use `toSpeechText` for a fully-plain sentence.
 */
export function stripGrammarBrackets(sentence: string): string {
  return sentence.replace(/[【】]/g, "");
}

/**
 * Convert an annotated sentence into the plain Japanese form suitable for
 * speech synthesis: strips `【】` markers AND collapses `{kanji|reading}` to
 * just the kanji portion (the reading is for display only).
 */
export function toSpeechText(sentence: string): string {
  // Use a fresh regex instance to avoid lastIndex state interfering with
  // the shared FURIGANA_RE used by the parser.
  return sentence
    .replace(/\{([^|{}]+)\|[^}]+\}/g, "$1")
    .replace(/[【】]/g, "");
}
