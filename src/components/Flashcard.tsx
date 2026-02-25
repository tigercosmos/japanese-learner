import type { FlashcardContent } from "../types";
import GrammarHighlight from "./GrammarHighlight";

interface FlashcardProps {
  content: FlashcardContent;
  isFlipped: boolean;
  onFlip: () => void;
}

function renderText(text: string) {
  // Check for grammar highlight/blank markers
  if (text.startsWith("__GRAMMAR_HIGHLIGHT__")) {
    return <GrammarHighlight sentence={text.replace("__GRAMMAR_HIGHLIGHT__", "")} mode="highlight" />;
  }
  if (text.startsWith("__GRAMMAR_BLANK__")) {
    return <GrammarHighlight sentence={text.replace("__GRAMMAR_BLANK__", "")} mode="blank" />;
  }
  return text;
}

export default function Flashcard({ content, isFlipped, onFlip }: FlashcardProps) {
  return (
    <div className="perspective w-full" style={{ minHeight: "280px" }}>
      <div
        className={`card-flip relative w-full cursor-pointer ${isFlipped ? "flipped" : ""}`}
        style={{ minHeight: "280px" }}
        onClick={!isFlipped ? onFlip : undefined}
      >
        {/* Front */}
        <div className="card-face absolute inset-0 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center justify-center p-8">
          <div className="text-3xl font-bold text-gray-900 text-center leading-relaxed">
            {renderText(content.front.primary)}
          </div>
          {content.front.secondary && (
            <div className="text-base text-gray-500 mt-3 text-center">
              {content.front.secondary}
            </div>
          )}
          <div className="absolute bottom-4 text-xs text-gray-400">點擊翻面</div>
        </div>

        {/* Back */}
        <div className="card-face card-back absolute inset-0 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center justify-center p-8">
          <div className="text-3xl font-bold text-gray-900 text-center leading-relaxed">
            {renderText(content.back.primary)}
          </div>
          {content.back.secondary && (
            <div className="text-lg text-gray-600 mt-3 text-center">
              {content.back.secondary}
            </div>
          )}
          {content.back.detail && (
            <div className="text-sm text-gray-400 mt-4 text-center max-w-sm leading-relaxed">
              {content.back.detail}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
