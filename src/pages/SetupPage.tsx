import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDatasetById } from "../hooks/useDatasets";
import ModeSelector from "../components/ModeSelector";
import type { TestMode } from "../types";
import { VOCAB_TEST_MODES, GRAMMAR_TEST_MODES } from "../types";

const SESSION_SIZES = [10, 20, 30];

export default function SetupPage() {
  const { datasetId } = useParams<{ datasetId: string }>();
  const navigate = useNavigate();
  const dataset = useDatasetById(datasetId ?? "");

  const isVocab = dataset?.category === "vocabulary";
  const modes = isVocab ? VOCAB_TEST_MODES : GRAMMAR_TEST_MODES;
  const defaultMode = modes[0].value;

  const [selectedMode, setSelectedMode] = useState<string>(defaultMode);
  const [sessionSize, setSessionSize] = useState(20);

  if (!dataset) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p>找不到學習集</p>
      </div>
    );
  }

  const handleStart = () => {
    navigate(`/study/${datasetId}/session`, {
      state: { mode: selectedMode, sessionSize },
    });
  };

  return (
    <div>
      {/* Dataset info */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">{dataset.name}</h2>
        <p className="text-sm text-gray-500 mt-1">
          {dataset.level} · {dataset.data.length} 張卡片
        </p>
      </div>

      {/* Test mode selection */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">測驗模式</h3>
        <ModeSelector
          modes={modes}
          selected={selectedMode}
          onChange={(mode: TestMode) => setSelectedMode(mode)}
        />
      </div>

      {/* Session size */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">每次數量</h3>
        <div className="flex gap-2">
          {SESSION_SIZES.map((size) => (
            <button
              key={size}
              onClick={() => setSessionSize(size)}
              className={`px-5 py-2 rounded-xl font-medium transition-colors ${
                sessionSize === size
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {size}
            </button>
          ))}
          <button
            onClick={() => setSessionSize(dataset.data.length)}
            className={`px-5 py-2 rounded-xl font-medium transition-colors ${
              !SESSION_SIZES.includes(sessionSize)
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            全部
          </button>
        </div>
      </div>

      {/* Start button */}
      <button
        onClick={handleStart}
        className="w-full py-4 rounded-xl bg-gray-900 text-white text-lg font-bold hover:bg-gray-800 transition-colors tap-active"
      >
        開始學習
      </button>
    </div>
  );
}
