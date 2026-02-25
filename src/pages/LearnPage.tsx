import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDatasetById } from "../hooks/useDatasets";
import LearnCard from "../components/LearnCard";
import ProgressBar from "../components/ProgressBar";

export default function LearnPage() {
  const { datasetId } = useParams<{ datasetId: string }>();
  const navigate = useNavigate();
  const dataset = useDatasetById(datasetId ?? "");
  const [currentIndex, setCurrentIndex] = useState(0);

  const totalCards = dataset?.data.length ?? 0;
  const currentItem = dataset?.data[currentIndex];
  const isComplete = currentIndex >= totalCards;

  const goNext = useCallback(() => {
    if (currentIndex < totalCards) {
      setCurrentIndex((i) => i + 1);
    }
  }, [currentIndex, totalCards]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  }, [currentIndex]);

  // Keyboard navigation: ← → arrows
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowRight" || e.code === "Space") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev]);

  if (!dataset) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p>找不到學習集</p>
      </div>
    );
  }

  // Completion view
  if (isComplete) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-2">📖</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">瀏覽完成！</h2>
        <p className="text-sm text-gray-500 mb-6">
          已看完全部 {totalCards} 張卡片
        </p>
        <div className="flex gap-3 max-w-xs mx-auto">
          <button
            onClick={() => setCurrentIndex(0)}
            className="flex-1 py-3 rounded-xl bg-gray-900 text-white font-semibold hover:bg-gray-800 transition-colors tap-active"
          >
            從頭開始
          </button>
          <button
            onClick={() => navigate(`/study/${datasetId}`)}
            className="flex-1 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors tap-active"
          >
            去測驗
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <ProgressBar current={currentIndex + 1} total={totalCards} />

      {/* Card */}
      {currentItem && (
        <div key={currentIndex} className="slide-in">
          <LearnCard item={currentItem} category={dataset.category} />
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={goPrev}
          disabled={currentIndex === 0}
          className={`flex-1 py-3 rounded-xl font-semibold transition-colors tap-active ${
            currentIndex === 0
              ? "bg-gray-100 text-gray-300 cursor-not-allowed"
              : "border-2 border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}
        >
          ← 上一張
        </button>
        <button
          onClick={goNext}
          className="flex-1 py-3 rounded-xl bg-gray-900 text-white font-semibold hover:bg-gray-800 transition-colors tap-active"
        >
          {currentIndex === totalCards - 1 ? "完成" : "下一張 →"}
        </button>
      </div>

      {/* Keyboard hint (desktop only) */}
      <div className="hidden sm:block text-center mt-4 text-xs text-gray-400">
        ← 上一張 · → 下一張
      </div>
    </div>
  );
}
