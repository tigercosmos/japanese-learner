import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useDatasetById } from "../hooks/useDatasets";
import { useStudySession } from "../hooks/useStudySession";
import { useKeyboard } from "../hooks/useKeyboard";
import { useSwipe } from "../hooks/useSwipe";
import Flashcard from "../components/Flashcard";
import RatingButtons from "../components/RatingButtons";
import ProgressBar from "../components/ProgressBar";
import SessionSummary from "../components/SessionSummary";
import type { TestMode, SessionType } from "../types";

interface ReturnTo {
  dayIndex: number;
  totalDays: number;
  datasetId: string;
}

export default function StudyPage() {
  const { datasetId } = useParams<{ datasetId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const dataset = useDatasetById(datasetId ?? "");

  const { mode, sessionSize, sessionType, specificCardIds, returnTo } = (location.state as {
    mode: TestMode;
    sessionSize: number;
    sessionType?: SessionType;
    specificCardIds?: string[];
    returnTo?: ReturnTo;
  }) ?? {
    mode: "kanji-to-chinese" as TestMode,
    sessionSize: 20,
  };

  const {
    currentCard,
    currentIndex,
    totalCards,
    isFlipped,
    isSessionComplete,
    sessionResult,
    flip,
    rate,
  } = useStudySession(dataset, mode, sessionSize, sessionType ?? "due", specificCardIds);

  useKeyboard({
    isFlipped,
    onFlip: flip,
    onRate: rate,
    enabled: !isSessionComplete && !!currentCard,
  });

  const { targetRef: swipeRef, swipeState } = useSwipe({
    onSwipe: rate,
    enabled: !isSessionComplete && !!currentCard,
    key: currentIndex,
  });

  if (!dataset) {
    return (
      <div className="text-center py-12 text-gray-400 dark:text-gray-500">
        <p>找不到學習集</p>
      </div>
    );
  }

  if (isSessionComplete) {
    // Build nextAction when returnTo is defined and there's a next day
    const nextAction =
      returnTo && returnTo.dayIndex + 1 < returnTo.totalDays
        ? {
            label: "學習下一天",
            onClick: () =>
              navigate(`/learn/${returnTo.datasetId}/session`, {
                state: { planType: "daily", dayIndex: returnTo.dayIndex + 1 },
              }),
          }
        : undefined;

    return (
      <SessionSummary
        result={sessionResult}
        onStudyAgain={() => {
          // Navigate back to setup to start a new session
          navigate(`/study/${datasetId}`, { replace: true });
        }}
        onGoHome={() => navigate("/", { replace: true })}
        nextAction={nextAction}
      />
    );
  }

  if (!currentCard) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-3">✨</div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-2">目前沒有待複習的卡片</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">所有卡片都已經複習完畢！</p>
        <button
          onClick={() => navigate("/", { replace: true })}
          className="px-6 py-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
        >
          回首頁
        </button>
      </div>
    );
  }

  return (
    <div>
      <ProgressBar current={currentIndex} total={totalCards} />

      <div key={currentIndex} className="slide-in" ref={swipeRef}>
        <Flashcard
          content={currentCard.flashcard}
          isFlipped={isFlipped}
          onFlip={flip}
          swipe={swipeState}
        />
      </div>

      <RatingButtons onRate={rate} visible={isFlipped} />

      {/* Swipe hint (mobile) */}
      <div className="sm:hidden text-center mt-4 text-xs text-gray-400 dark:text-gray-500">
        ← 不會 · ↓ 還好 · → 記住了
      </div>

      {/* Keyboard hint (desktop only) */}
      <div className="hidden sm:block text-center mt-4 text-xs text-gray-400 dark:text-gray-500">
        空白鍵翻面 · 1 不會 · 2 還好 · 3 記住了 · 可拖曳卡片
      </div>
    </div>
  );
}
