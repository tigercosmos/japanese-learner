interface StatsBarProps {
  learnedCards: number;
  masteredCards: number;
  totalCards: number;
}

export default function StatsBar({ learnedCards, masteredCards, totalCards }: StatsBarProps) {
  const learnedPct = totalCards > 0 ? (learnedCards / totalCards) * 100 : 0;
  const masteredPct = totalCards > 0 ? (masteredCards / totalCards) * 100 : 0;

  return (
    <div className="mt-2.5">
      <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mb-1">
        <span>已學 {learnedCards} · 熟練 {masteredCards}</span>
      </div>
      <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden flex">
        {masteredPct > 0 && (
          <div
            className="bg-emerald-400 transition-all duration-300"
            style={{ width: `${masteredPct}%` }}
          />
        )}
        {learnedPct - masteredPct > 0 && (
          <div
            className="bg-blue-300 transition-all duration-300"
            style={{ width: `${learnedPct - masteredPct}%` }}
          />
        )}
      </div>
    </div>
  );
}
