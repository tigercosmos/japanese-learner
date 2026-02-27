import type { TestMode } from "../types";

interface ModeSelectorProps {
  modes: { value: string; label: string; description: string }[];
  selected: string;
  onChange: (mode: TestMode) => void;
}

export default function ModeSelector({ modes, selected, onChange }: ModeSelectorProps) {
  return (
    <select
      value={selected}
      onChange={(e) => onChange(e.target.value as TestMode)}
      className="w-full p-3 rounded-xl border-2 border-gray-200 bg-white text-gray-900 font-medium focus:border-gray-900 focus:outline-none transition-colors"
    >
      {modes.map((mode) => (
        <option key={mode.value} value={mode.value}>
          {mode.label}（{mode.description}）
        </option>
      ))}
    </select>
  );
}
