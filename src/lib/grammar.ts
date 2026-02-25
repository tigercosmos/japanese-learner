export interface GrammarPart {
  text: string;
  isGrammar: boolean;
}

/**
 * Parse a sentence with 【bracket】 notation into parts.
 * Example: "勉強している【うちに】眠くなった"
 *  → [
 *      { text: "勉強している", isGrammar: false },
 *      { text: "うちに", isGrammar: true },
 *      { text: "眠くなった", isGrammar: false },
 *    ]
 */
export function parseGrammarSentence(sentence: string): GrammarPart[] {
  const parts: GrammarPart[] = [];
  const regex = /【([^】]+)】/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(sentence)) !== null) {
    // Text before the bracket
    if (match.index > lastIndex) {
      parts.push({ text: sentence.slice(lastIndex, match.index), isGrammar: false });
    }
    // The grammar part inside brackets
    parts.push({ text: match[1], isGrammar: true });
    lastIndex = regex.lastIndex;
  }

  // Remaining text after last bracket
  if (lastIndex < sentence.length) {
    parts.push({ text: sentence.slice(lastIndex), isGrammar: false });
  }

  return parts;
}

/**
 * Render sentence with grammar parts highlighted (returns parts for React rendering).
 */
export function getHighlightedParts(sentence: string): GrammarPart[] {
  return parseGrammarSentence(sentence);
}

/**
 * Render sentence with grammar parts replaced by blanks.
 */
export function getBlankParts(sentence: string): GrammarPart[] {
  return parseGrammarSentence(sentence).map((part) =>
    part.isGrammar ? { text: "____", isGrammar: true } : part,
  );
}

/**
 * Extract just the grammar text from brackets.
 */
export function extractGrammarText(sentence: string): string {
  const parts = parseGrammarSentence(sentence);
  return parts
    .filter((p) => p.isGrammar)
    .map((p) => p.text)
    .join("");
}
