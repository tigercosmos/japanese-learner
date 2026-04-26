import { parseChunks } from "../lib/grammar";
import Furigana from "./Furigana";

interface GrammarHighlightProps {
  sentence: string;
  mode: "highlight" | "blank";
}

const HIGHLIGHT_CLASS =
  "bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-200 px-1 rounded font-bold";
const BLANK_CLASS = "text-amber-600 dark:text-amber-400 font-bold";

export default function GrammarHighlight({ sentence, mode }: GrammarHighlightProps) {
  const chunks = parseChunks(sentence);

  return (
    <span>
      {chunks.map((chunk, ci) => {
        if (!chunk.isGrammar) {
          return chunk.parts.map((p, i) => (
            <Furigana key={`${ci}.${i}`} text={p.text} reading={p.reading} />
          ));
        }
        // One pill / blank per 【...】 bracket — adjacent brackets stay
        // separate even when no non-grammar text sits between them.
        if (mode === "blank") {
          return (
            <span key={ci} data-testid="grammar-blank" className={BLANK_CLASS}>
              ____
            </span>
          );
        }
        return (
          <span key={ci} data-testid="grammar-pill" className={HIGHLIGHT_CLASS}>
            {chunk.parts.map((p, i) => (
              <Furigana key={`${ci}.${i}`} text={p.text} reading={p.reading} />
            ))}
          </span>
        );
      })}
    </span>
  );
}
