interface ProgressBarProps {
  current: number;
  total: number;
}

export default function ProgressBar({ current, total }: ProgressBarProps) {
  const pct = total > 0 ? Math.min((current / total) * 100, 100) : 0;

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-sm text-gray-500">
          {current} / {total}
        </span>
        <span className="text-sm text-gray-500">{Math.round(pct)}%</span>
      </div>
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gray-900 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
