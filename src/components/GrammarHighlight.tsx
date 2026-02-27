import { getHighlightedParts, getBlankParts } from "../lib/grammar";

interface GrammarHighlightProps {
  sentence: string;
  mode: "highlight" | "blank";
}

export default function GrammarHighlight({ sentence, mode }: GrammarHighlightProps) {
  const parts = mode === "highlight" ? getHighlightedParts(sentence) : getBlankParts(sentence);

  return (
    <span>
      {parts.map((part, i) =>
        part.isGrammar ? (
          <span
            key={i}
            className={
              mode === "highlight"
                ? "bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-200 px-1 rounded font-bold"
                : "text-amber-600 dark:text-amber-400 font-bold"
            }
          >
            {part.text}
          </span>
        ) : (
          <span key={i}>{part.text}</span>
        ),
      )}
    </span>
  );
}
