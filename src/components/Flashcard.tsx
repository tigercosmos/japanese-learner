import type { FlashcardContent, Rating } from "../types";
import { RATING_CONFIG } from "../types";
import GrammarHighlight from "./GrammarHighlight";

interface SwipeVisual {
  offsetX: number;
  offsetY: number;
  swiping: boolean;
  direction: Rating | null;
}

interface FlashcardProps {
  content: FlashcardContent;
  isFlipped: boolean;
  onFlip: () => void;
  swipe?: SwipeVisual;
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

const DIRECTION_COLORS: Record<Rating, string> = {
  again: "rgba(239, 68, 68, 0.25)",  // red
  hard: "rgba(245, 158, 11, 0.25)",   // amber
  good: "rgba(16, 185, 129, 0.25)",   // emerald
};

export default function Flashcard({ content, isFlipped, onFlip, swipe }: FlashcardProps) {
  const isSwiping = swipe?.swiping && swipe.direction;

  // Card transform during swipe (translate + slight rotation)
  const swipeTransform = swipe?.swiping
    ? `translate(${swipe.offsetX * 0.5}px, ${swipe.offsetY * 0.3}px) rotate(${swipe.offsetX * 0.05}deg)`
    : "";

  const swipeTransition = swipe?.swiping ? "none" : "transform 0.3s ease";

  return (
    <div className="perspective w-full relative" style={{ minHeight: "280px" }}>
      {/* Swipe direction indicator overlay */}
      {isSwiping && (
        <div
          className="absolute inset-0 rounded-2xl flex items-center justify-center z-10 pointer-events-none transition-opacity duration-150"
          style={{ backgroundColor: DIRECTION_COLORS[swipe.direction!] }}
        >
          <span className="text-2xl font-bold text-white drop-shadow-md">
            {RATING_CONFIG[swipe.direction!].label}
          </span>
        </div>
      )}

      <div
        className="relative w-full cursor-pointer"
        style={{
          minHeight: "280px",
          transform: swipeTransform,
          transition: swipeTransition,
        }}
        onClick={onFlip}
      >
      <div
        className={`card-flip absolute inset-0 ${isFlipped ? "flipped" : ""}`}
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
          <div className="absolute bottom-4 text-xs text-gray-400">點擊翻回</div>
        </div>
      </div>
      </div>
    </div>
  );
}
