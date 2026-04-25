import type { FlashcardContent, Rating } from "../types";
import { RATING_CONFIG } from "../types";
import GrammarHighlight from "./GrammarHighlight";
import SpeakButton from "./SpeakButton";

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
  showSwipeAssist?: boolean;
}

function renderText(text: string) {
  if (text.startsWith("__GRAMMAR_HIGHLIGHT__")) {
    return <GrammarHighlight sentence={text.replace("__GRAMMAR_HIGHLIGHT__", "")} mode="highlight" />;
  }
  if (text.startsWith("__GRAMMAR_BLANK__")) {
    return <GrammarHighlight sentence={text.replace("__GRAMMAR_BLANK__", "")} mode="blank" />;
  }
  return text;
}

const DIRECTION_COLORS: Record<Rating, string> = {
  again: "rgba(239, 68, 68, 0.25)",
  hard: "rgba(245, 158, 11, 0.25)",
  good: "rgba(16, 185, 129, 0.25)",
};

export default function Flashcard({ content, isFlipped, onFlip, swipe, showSwipeAssist = true }: FlashcardProps) {
  const isSwiping = showSwipeAssist && swipe?.swiping && swipe.direction;

  const swipeTransform = swipe?.swiping
    ? `translate(${swipe.offsetX * 0.5}px, ${swipe.offsetY * 0.3}px) rotate(${swipe.offsetX * 0.05}deg)`
    : "";
  const swipeTransition = swipe?.swiping ? "none" : "transform 0.3s ease";

  const { pronunciation } = content.back;
  // When primary IS the Japanese word (chinese-to-japanese), show speaker inline with primary
  const pronunciationIsPrimary = pronunciation !== undefined && pronunciation === content.back.primary;

  return (
    <div className="perspective w-full relative" style={{ minHeight: "280px" }}>
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
        style={{ minHeight: "280px", transform: swipeTransform, transition: swipeTransition }}
        onClick={onFlip}
      >
        <div className={`card-flip absolute inset-0 ${isFlipped ? "flipped" : ""}`}>

          {/* Front */}
          <div className="card-face absolute inset-0 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col items-center justify-center p-8">
            <div className="flex items-start justify-center gap-1.5">
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-50 text-center leading-relaxed">
                {renderText(content.front.primary)}
              </div>
              {content.front.pronunciation && <SpeakButton text={content.front.pronunciation} />}
            </div>
            {content.front.secondary && (
              <div className="text-base text-gray-500 dark:text-gray-400 mt-3 text-center">
                {content.front.secondary}
              </div>
            )}
            <div className="absolute bottom-4 text-xs text-gray-400 dark:text-gray-500">點擊翻面</div>
          </div>

          {/* Back */}
          <div className="card-face card-back absolute inset-0 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col items-center justify-center p-8">

            {/* Primary — if it IS the Japanese word, show speaker inline */}
            {pronunciationIsPrimary ? (
              <div className="flex items-center justify-center gap-1.5">
                <div className="text-3xl font-bold text-gray-900 dark:text-gray-50 text-center leading-relaxed">
                  {renderText(content.back.primary)}
                </div>
                <SpeakButton text={pronunciation} />
              </div>
            ) : (
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-50 text-center leading-relaxed">
                {renderText(content.back.primary)}
              </div>
            )}

            {/* Pronunciation row — Japanese word + speaker (when primary is Chinese) */}
            {pronunciation && !pronunciationIsPrimary && (
              <div className="flex items-center justify-center gap-1.5 mt-3">
                <span className="text-2xl font-bold text-gray-900 dark:text-gray-50">
                  {pronunciation}
                </span>
                <SpeakButton text={pronunciation} />
              </div>
            )}

            {content.back.secondary && (
              <div className="flex items-start justify-center gap-1.5 mt-3">
                <div className="text-lg text-gray-600 dark:text-gray-300 text-center">
                  {content.back.secondary}
                </div>
                {content.back.secondaryPronunciation && (
                  <SpeakButton text={content.back.secondaryPronunciation} size="sm" />
                )}
              </div>
            )}
            {content.back.detail && (
              <div className="text-sm text-gray-400 dark:text-gray-500 mt-4 text-center max-w-sm leading-relaxed">
                {content.back.detail}
              </div>
            )}
            <div className="absolute bottom-4 text-xs text-gray-400 dark:text-gray-500">點擊翻回</div>
          </div>

        </div>
      </div>
    </div>
  );
}
