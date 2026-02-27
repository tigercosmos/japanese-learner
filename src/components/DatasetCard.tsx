import { useNavigate } from "react-router-dom";
import type { DatasetMeta } from "../types";
import StatsBar from "./StatsBar";

interface DatasetCardProps {
  dataset: DatasetMeta;
}

const categoryLabels: Record<string, string> = {
  vocabulary: "詞彙",
  grammar: "文法",
};

const categoryColors: Record<string, string> = {
  vocabulary: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  grammar: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
};

export default function DatasetCard({ dataset }: DatasetCardProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/study/${dataset.id}`)}
      className="w-full text-left bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all tap-active"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${categoryColors[dataset.category] ?? "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"}`}
            >
              {categoryLabels[dataset.category] ?? dataset.category}
            </span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
              {dataset.level}
            </span>
          </div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50 truncate">{dataset.name}</h3>
        </div>
        <div className="text-right ml-4 shrink-0">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-50">{dataset.dueCards}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">待複習 / {dataset.totalCards}</div>
        </div>
      </div>
      <StatsBar
        learnedCards={dataset.learnedCards}
        masteredCards={dataset.masteredCards}
        totalCards={dataset.totalCards}
      />
    </button>
  );
}
