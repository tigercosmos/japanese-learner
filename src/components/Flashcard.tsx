import type { FlashcardContent, Rating } from "../types";
import { RATING_CONFIG } from "../types";
import { toSpeechText } from "../lib/grammar";
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

/**
 * Render the primary text of a face, returning the React node plus an optional
 * speakable string when the text is a highlighted Japanese sentence.
 */
function renderPrimary(text: string): { node: React.ReactNode; speakable: string | null } {
  if (text.startsWith("__GRAMMAR_HIGHLIGHT__")) {
    const sentence = text.replace("__GRAMMAR_HIGHLIGHT__", "");
    return {
      node: <GrammarHighlight sentence={sentence} mode="highlight" />,
      speakable: toSpeechText(sentence),
    };
  }
  if (text.startsWith("__GRAMMAR_BLANK__")) {
    return {
      node: <GrammarHighlight sentence={text.replace("__GRAMMAR_BLANK__", "")} mode="blank" />,
      speakable: null,
    };
  }
  return { node: text, speakable: null };
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

  const front = renderPrimary(content.front.primary);
  const back = renderPrimary(content.back.primary);

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
          <div
            className="card-face absolute inset-0 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col items-center justify-center p-8"
            // `inert` removes the inactive face from tab order and a11y tree
            inert={isFlipped}
          >
            <div className="flex items-center justify-center gap-1.5 max-w-full">
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-50 text-center leading-relaxed min-w-0">
                {front.node}
              </div>
              {front.speakable && <SpeakButton text={front.speakable} label={front.speakable} />}
            </div>
            {content.front.secondary && (
              <div className="text-base text-gray-500 dark:text-gray-400 mt-3 text-center">
                {content.front.secondary}
              </div>
            )}
            <div className="absolute bottom-4 text-xs text-gray-400 dark:text-gray-500">點擊翻面</div>
          </div>

          {/* Back */}
          <div
            className="card-face card-back absolute inset-0 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col items-center justify-center p-8"
            inert={!isFlipped}
          >

            {/* Primary — if it IS the Japanese word, show speaker inline */}
            {pronunciationIsPrimary ? (
              <div className="flex items-center justify-center gap-1.5 max-w-full">
                <div className="text-3xl font-bold text-gray-900 dark:text-gray-50 text-center leading-relaxed min-w-0">
                  {back.node}
                </div>
                <SpeakButton text={pronunciation} label={pronunciation} />
              </div>
            ) : (
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-50 text-center leading-relaxed">
                {back.node}
              </div>
            )}

            {/* Pronunciation row — Japanese word + speaker (when primary is Chinese) */}
            {pronunciation && !pronunciationIsPrimary && (
              <div className="flex items-center justify-center gap-1.5 mt-3 max-w-full">
                <span className="text-2xl font-bold text-gray-900 dark:text-gray-50 min-w-0">
                  {pronunciation}
                </span>
                <SpeakButton text={pronunciation} label={pronunciation} />
              </div>
            )}

            {content.back.secondary && (
              content.back.secondaryIsJapanese ? (
                <div className="flex items-center justify-center gap-1.5 mt-3 max-w-full">
                  <div className="text-lg text-gray-600 dark:text-gray-300 text-center min-w-0">
                    <GrammarHighlight sentence={content.back.secondary} mode="highlight" />
                  </div>
                  <SpeakButton
                    text={toSpeechText(content.back.secondary)}
                    size="sm"
                    label={toSpeechText(content.back.secondary)}
                  />
                </div>
              ) : (
                <div className="text-lg text-gray-600 dark:text-gray-300 mt-3 text-center">
                  {content.back.secondary}
                </div>
              )
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
