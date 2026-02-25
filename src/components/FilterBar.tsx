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
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {categoryLabels[cat] ?? cat}
          </button>
        ))}
      </div>

      {/* Level filter */}
      {levels.length > 0 && (
        <div className="flex gap-1">
          <div className="w-px bg-gray-200 mx-1" />
          {["", ...levels].map((lvl) => (
            <button
              key={lvl}
              onClick={() => onLevelChange(lvl)}
              className={`px-3 py-1.5 text-sm rounded-full font-medium transition-colors ${
                selectedLevel === lvl
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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
