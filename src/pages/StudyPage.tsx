import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useDatasetById } from "../hooks/useDatasets";
import { useStudySession } from "../hooks/useStudySession";
import { useKeyboard } from "../hooks/useKeyboard";
import Flashcard from "../components/Flashcard";
import RatingButtons from "../components/RatingButtons";
import ProgressBar from "../components/ProgressBar";
import SessionSummary from "../components/SessionSummary";
import type { TestMode } from "../types";

export default function StudyPage() {
  const { datasetId } = useParams<{ datasetId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const dataset = useDatasetById(datasetId ?? "");

  const { mode, sessionSize } = (location.state as { mode: TestMode; sessionSize: number }) ?? {
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
  } = useStudySession(dataset, mode, sessionSize);

  useKeyboard({
    isFlipped,
    onFlip: flip,
    onRate: rate,
    enabled: !isSessionComplete && !!currentCard,
  });

  if (!dataset) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p>找不到學習集</p>
      </div>
    );
  }

  if (isSessionComplete) {
    return (
      <SessionSummary
        result={sessionResult}
        onStudyAgain={() => {
          // Navigate back to setup to start a new session
          navigate(`/study/${datasetId}`, { replace: true });
        }}
        onGoHome={() => navigate("/", { replace: true })}
      />
    );
  }

  if (!currentCard) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-3">✨</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">目前沒有待複習的卡片</h2>
        <p className="text-sm text-gray-500 mb-6">所有卡片都已經複習完畢！</p>
        <button
          onClick={() => navigate("/", { replace: true })}
          className="px-6 py-3 rounded-xl bg-gray-900 text-white font-semibold hover:bg-gray-800 transition-colors"
        >
          回首頁
        </button>
      </div>
    );
  }

  return (
    <div>
      <ProgressBar current={currentIndex} total={totalCards} />

      <div key={currentIndex} className="slide-in">
        <Flashcard content={currentCard.flashcard} isFlipped={isFlipped} onFlip={flip} />
      </div>

      <RatingButtons onRate={rate} visible={isFlipped} />

      {/* Keyboard hint (desktop only) */}
      <div className="hidden sm:block text-center mt-4 text-xs text-gray-400">
        空白鍵翻面 · 1 不會 · 2 還好 · 3 記住了
      </div>
    </div>
  );
}
