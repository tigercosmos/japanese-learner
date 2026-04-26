import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useDatasetById } from "../hooks/useDatasets";
import { useDatasetCrud, isBuiltinDataset } from "../hooks/useDatasetCrud";
import { useStudyPlan } from "../hooks/useStudyPlan";
import LearnCard from "../components/LearnCard";
import ProgressBar from "../components/ProgressBar";
import ConfirmDialog from "../components/ConfirmDialog";
import { loadTestModes, loadLearnPosition, saveLearnPosition } from "../lib/storage";
import { VOCAB_TEST_MODES, GRAMMAR_TEST_MODES, MIX_TEST_MODES, MIX_DEFAULT_MODES } from "../types";

interface LearnLocationState {
  planType?: "all" | "daily";
  dayIndex?: number;
}

export default function LearnPage() {
  const { datasetId } = useParams<{ datasetId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const dataset = useDatasetById(datasetId ?? "");
  const crud = useDatasetCrud();
  const { plan } = useStudyPlan(datasetId ?? "");

  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);

  // Resolve planType + initial position once per mount. We prefer location.state
  // (the normal entry path), but fall back to saved.planType so a page reload
  // still resumes correctly. cardIndex is clamped against current data so a
  // saved index past the end (after item deletion / plan shrink / completion)
  // doesn't drop the user straight into the completion screen.
  const [init] = useState(() => {
    const locationState = (location.state as LearnLocationState | null) ?? null;
    const saved = loadLearnPosition(datasetId ?? "");
    const planType: "all" | "daily" =
      locationState?.planType ?? saved?.planType ?? "all";
    const fallbackDay = locationState?.dayIndex ?? 0;

    const savedMatches =
      !!saved &&
      saved.planType === planType &&
      !(planType === "daily" && plan && saved.dayIndex >= plan.totalDays);

    if (!savedMatches) {
      return { planType, dayIndex: fallbackDay, cardIndex: 0 };
    }

    const items = dataset?.data ?? [];
    let dayCount: number;
    if (planType === "daily" && plan) {
      const ids = new Set(items.map((it) => it.id));
      dayCount = (plan.cardIds[saved!.dayIndex] ?? []).filter((id) => ids.has(id)).length;
    } else {
      dayCount = items.length;
    }

    return {
      planType,
      dayIndex: saved!.dayIndex,
      cardIndex: dayCount > 0 ? Math.min(saved!.cardIndex, dayCount - 1) : 0,
    };
  });

  const planType = init.planType;
  const [currentDayIndex, setCurrentDayIndex] = useState(init.dayIndex);
  const [currentIndex, setCurrentIndex] = useState(init.cardIndex);

  const selectDay = useCallback((day: number) => {
    setCurrentDayIndex(day);
    setCurrentIndex(0);
  }, []);

  const isDaily = planType === "daily" && !!plan && !!dataset;

  // Determine cards for the current view
  const allDataItems = dataset?.data ?? [];
  let dayCards = allDataItems;
  let dayCardIds: string[] = allDataItems.map((item) => item.id);

  if (isDaily) {
    const dayCardIdSet = plan!.cardIds[currentDayIndex] ?? [];
    const idToIndex = new Map(dayCardIdSet.map((id, i) => [id, i]));
    const filtered = allDataItems
      .filter((item) => idToIndex.has(item.id))
      .sort((a, b) => (idToIndex.get(a.id) ?? 0) - (idToIndex.get(b.id) ?? 0));
    dayCards = filtered;
    dayCardIds = dayCardIdSet;
  }

  const totalCards = dayCards.length;
  const currentItem = dayCards[currentIndex];
  const isComplete = currentIndex >= totalCards;
  const hasNextDay = isDaily && currentDayIndex + 1 < plan!.totalDays;

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

  // Persist position so the user can resume from where they left off
  useEffect(() => {
    if (!datasetId || !dataset) return;
    saveLearnPosition({
      datasetId,
      planType,
      dayIndex: currentDayIndex,
      cardIndex: currentIndex,
      updatedAt: new Date().toISOString(),
    });
  }, [datasetId, dataset, planType, currentDayIndex, currentIndex]);

  const navigateToExam = useCallback(() => {
    if (!dataset) return;
    const category = dataset.category;
    const isMix = category === "mix";
    const modeOptions = isMix ? MIX_TEST_MODES : category === "vocabulary" ? VOCAB_TEST_MODES : GRAMMAR_TEST_MODES;
    const saved = loadTestModes(category);

    // Resolve modes: support both saved string and string[]
    let resolvedModes: string | string[];
    const defaultModes = isMix ? MIX_DEFAULT_MODES : [modeOptions[0].value];
    if (saved == null) {
      resolvedModes = isMix ? MIX_DEFAULT_MODES : modeOptions[0].value;
    } else if (Array.isArray(saved)) {
      const valid = saved.filter((s) => modeOptions.some((m) => m.value === s));
      resolvedModes = valid.length === 0 ? (defaultModes.length === 1 ? defaultModes[0] : defaultModes) : valid.length === 1 ? valid[0] : valid;
    } else {
      resolvedModes = modeOptions.some((m) => m.value === saved) ? saved : (defaultModes.length === 1 ? defaultModes[0] : defaultModes);
    }

    navigate(`/study/${datasetId}/session`, {
      state: {
        modes: resolvedModes,
        sessionSize: dayCardIds.length,
        sessionType: "specific",
        specificCardIds: dayCardIds,
        returnTo: isDaily
          ? { dayIndex: currentDayIndex, totalDays: plan!.totalDays, datasetId }
          : undefined,
      },
    });
  }, [dataset, datasetId, dayCardIds, isDaily, currentDayIndex, plan, navigate]);

  if (!dataset) {
    return (
      <div className="text-center py-12 text-gray-400 dark:text-gray-500">
        <p>找不到學習集</p>
      </div>
    );
  }

  // Day completion screen
  if (isComplete) {
    return (
      <div>
        {/* Day tabs (daily mode only) */}
        {isDaily && <DayTabs plan={plan!} currentDayIndex={currentDayIndex} onSelectDay={selectDay} />}

        <div className="text-center py-8">
          <div className="text-4xl mb-2">📖</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-2">
            {isDaily ? `第 ${currentDayIndex + 1} 天完成！` : "瀏覽完成！"}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            {isDaily
              ? `已看完 ${totalCards} 張卡片`
              : `已看完全部 ${totalCards} 張卡片`}
          </p>
          <div className="flex flex-col gap-3 max-w-xs mx-auto">
            <button
              onClick={() => setCurrentIndex(0)}
              className="py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors tap-active"
            >
              從頭看今天
            </button>
            <button
              onClick={navigateToExam}
              className="py-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors tap-active"
            >
              {isDaily ? "測驗今天的卡片" : "去測驗"}
            </button>
            {hasNextDay && (
              <button
                onClick={() => selectDay(currentDayIndex + 1)}
                className="py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors tap-active"
              >
                下一天 →
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Day tabs (daily mode only) */}
      {isDaily && <DayTabs plan={plan!} currentDayIndex={currentDayIndex} onSelectDay={selectDay} />}

      <ProgressBar current={currentIndex + 1} total={totalCards} />

      {/* Card */}
      {currentItem && (
        <div key={`${currentDayIndex}-${currentIndex}`} className="slide-in">
          <LearnCard item={currentItem} category={dataset.category} />
          {/* Edit / Delete buttons */}
          <div className="flex justify-end gap-1 mt-2">
            <button
              onClick={() => navigate(`/manage/${datasetId}/item/${currentItem.id}`)}
              className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              title="編輯"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
            </button>
            <button
              onClick={() => setDeleteItemId(currentItem.id)}
              className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              title="刪除"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={goPrev}
          disabled={currentIndex === 0}
          className={`flex-1 py-3 rounded-xl font-semibold transition-colors tap-active ${
            currentIndex === 0
              ? "bg-gray-100 dark:bg-gray-700 text-gray-300 dark:text-gray-500 cursor-not-allowed"
              : "border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          }`}
        >
          ← 上一張
        </button>
        <button
          onClick={goNext}
          className="flex-1 py-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors tap-active"
        >
          {currentIndex === totalCards - 1 ? "完成" : "下一張 →"}
        </button>
      </div>

      {/* Exam button — always visible */}
      <button
        onClick={navigateToExam}
        className="w-full mt-3 py-3 rounded-xl border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors tap-active"
      >
        {isDaily ? "開始測驗今天的卡片" : "開始測驗"}
      </button>

      {/* Keyboard hint (desktop only) */}
      <div className="hidden sm:block text-center mt-4 text-xs text-gray-400 dark:text-gray-500">
        ← 上一張 · → 下一張
      </div>

      {/* Delete item confirmation */}
      {deleteItemId && (
        <ConfirmDialog
          message="確定要刪除這個項目嗎？"
          onConfirm={() => {
            const builtin = isBuiltinDataset(dataset.id) ? dataset : undefined;
            crud.deleteItem(dataset.id, deleteItemId, builtin);
            setDeleteItemId(null);
            // Adjust index if needed
            if (currentIndex >= dayCards.length - 1 && currentIndex > 0) {
              setCurrentIndex((i) => i - 1);
            }
          }}
          onCancel={() => setDeleteItemId(null)}
        />
      )}
    </div>
  );
}

interface DayTabsProps {
  plan: import("../types").StudyPlan;
  currentDayIndex: number;
  onSelectDay: (day: number) => void;
}

function DayTabs({ plan, currentDayIndex, onSelectDay }: DayTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
      {plan.cardIds.map((cards, dayIdx) => (
        <button
          key={dayIdx}
          onClick={() => onSelectDay(dayIdx)}
          className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-colors tap-active ${
            currentDayIndex === dayIdx
              ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
              : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
          }`}
        >
          第 {dayIdx + 1} 天
          <span className="ml-1 text-xs opacity-70">({cards.length})</span>
        </button>
      ))}
    </div>
  );
}
