import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDatasetById } from "../hooks/useDatasets";
import { loadProgress, loadTestMode, saveTestMode } from "../lib/storage";
import { getDatasetStats } from "../lib/stats";
import ModeSelector from "../components/ModeSelector";
import DatasetStatsDisplay from "../components/DatasetStats";
import type { TestMode, SessionType } from "../types";
import { VOCAB_TEST_MODES, GRAMMAR_TEST_MODES } from "../types";

const SESSION_SIZES = [10, 20, 30];

export default function SetupPage() {
  const { datasetId } = useParams<{ datasetId: string }>();
  const navigate = useNavigate();
  const dataset = useDatasetById(datasetId ?? "");

  const category = dataset?.category ?? "vocabulary";
  const isVocab = category === "vocabulary";
  const modes = isVocab ? VOCAB_TEST_MODES : GRAMMAR_TEST_MODES;
  const savedMode = loadTestMode(category);
  const defaultMode = (savedMode && modes.some((m) => m.value === savedMode)) ? savedMode : modes[0].value;

  const [selectedMode, setSelectedMode] = useState<string>(defaultMode);

  const handleModeChange = (mode: TestMode) => {
    setSelectedMode(mode);
    saveTestMode(category, mode);
  };
  const [sessionSize, setSessionSize] = useState(20);

  if (!dataset) {
    return (
      <div className="text-center py-12 text-gray-400 dark:text-gray-500">
        <p>找不到學習集</p>
      </div>
    );
  }

  const progress = loadProgress();
  const stats = getDatasetStats(dataset.data, progress);

  const handleStart = (sessionType: SessionType) => {
    navigate(`/study/${datasetId}/session`, {
      state: { mode: selectedMode, sessionSize, sessionType },
    });
  };

  const handleLearn = () => {
    navigate(`/learn/${datasetId}`);
  };

  return (
    <div>
      {/* Dataset info */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50">{dataset.name}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {dataset.level} · {dataset.data.length} 張卡片
        </p>
      </div>

      {/* Statistics */}
      <DatasetStatsDisplay stats={stats} />

      {/* Learn mode button */}
      <button
        onClick={handleLearn}
        className="w-full mb-6 py-3 rounded-xl border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors tap-active flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
        </svg>
        學習模式（瀏覽全部卡片）
      </button>

      {/* Test mode selection */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">測驗模式</h3>
        <ModeSelector
          modes={modes}
          selected={selectedMode}
          onChange={handleModeChange}
        />
      </div>

      {/* Session size */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">每次數量</h3>
        <div className="flex gap-2">
          {SESSION_SIZES.map((size) => (
            <button
              key={size}
              onClick={() => setSessionSize(size)}
              className={`px-5 py-2 rounded-xl font-medium transition-colors ${
                sessionSize === size
                  ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              {size}
            </button>
          ))}
          <button
            onClick={() => setSessionSize(dataset.data.length)}
            className={`px-5 py-2 rounded-xl font-medium transition-colors ${
              !SESSION_SIZES.includes(sessionSize)
                ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            全部
          </button>
        </div>
      </div>

      {/* Action buttons */}
      <div className="space-y-3">
        <button
          onClick={() => handleStart("due")}
          disabled={stats.dueCards === 0}
          className={`w-full py-4 rounded-xl text-lg font-bold transition-colors tap-active ${
            stats.dueCards === 0
              ? "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
              : "bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100"
          }`}
        >
          {stats.dueCards === 0 ? "沒有待複習的卡片" : `開始測驗（${stats.dueCards} 張待複習）`}
        </button>
        <button
          onClick={() => handleStart("random")}
          className="w-full py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors tap-active"
        >
          隨機複習（全部卡片）
        </button>
      </div>
    </div>
  );
}
