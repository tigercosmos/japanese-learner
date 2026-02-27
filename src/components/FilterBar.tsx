interface FilterBarProps {
  categories: string[];
  levels: string[];
  selectedCategory: string;
  selectedLevel: string;
  onCategoryChange: (category: string) => void;
  onLevelChange: (level: string) => void;
}

const categoryLabels: Record<string, string> = {
  "": "全部",
  vocabulary: "詞彙",
  grammar: "文法",
};

export default function FilterBar({
  categories,
  levels,
  selectedCategory,
  selectedLevel,
  onCategoryChange,
  onLevelChange,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {/* Category filter */}
      <div className="flex gap-1">
        {["", ...categories].map((cat) => (
          <button
            key={cat}
            onClick={() => onCategoryChange(cat)}
            className={`px-3 py-1.5 text-sm rounded-full font-medium transition-colors ${
              selectedCategory === cat
                ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            {categoryLabels[cat] ?? cat}
          </button>
        ))}
      </div>

      {/* Level filter */}
      {levels.length > 0 && (
        <div className="flex gap-1">
          <div className="w-px bg-gray-200 dark:bg-gray-600 mx-1" />
          {["", ...levels].map((lvl) => (
            <button
              key={lvl}
              onClick={() => onLevelChange(lvl)}
              className={`px-3 py-1.5 text-sm rounded-full font-medium transition-colors ${
                selectedLevel === lvl
                  ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              {lvl || "全部"}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
