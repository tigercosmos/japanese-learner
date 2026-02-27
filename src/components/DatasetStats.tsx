import type { DatasetStats } from "../lib/stats";

interface DatasetStatsProps {
  stats: DatasetStats;
}

export default function DatasetStatsDisplay({ stats }: DatasetStatsProps) {
  const items = [
    { label: "總卡片數", value: stats.totalCards, color: "text-gray-900 dark:text-gray-50" },
    { label: "已學習", value: stats.learnedCards, color: "text-blue-600 dark:text-blue-400" },
    { label: "待複習", value: stats.dueCards, color: "text-amber-600 dark:text-amber-400" },
    { label: "已熟練", value: stats.masteredCards, color: "text-emerald-600 dark:text-emerald-400" },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
      <div className="grid grid-cols-4 gap-2 text-center">
        {items.map((item) => (
          <div key={item.label}>
            <div className={`text-xl font-bold ${item.color}`}>{item.value}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.label}</div>
          </div>
        ))}
      </div>
      {/* Mastery progress bar */}
      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
          <span>熟練度</span>
          <span>{stats.masteryPercent}%</span>
        </div>
        <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-300"
            style={{ width: `${stats.masteryPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
