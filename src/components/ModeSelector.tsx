import type { TestMode } from "../types";

interface ModeSelectorProps {
  modes: { value: string; label: string; description: string }[];
  selected: string;
  onChange: (mode: TestMode) => void;
}

export default function ModeSelector({ modes, selected, onChange }: ModeSelectorProps) {
  return (
    <div className="space-y-2">
      {modes.map((mode) => (
        <button
          key={mode.value}
          onClick={() => onChange(mode.value as TestMode)}
          className={`w-full text-left p-4 rounded-xl border-2 transition-all tap-active ${
            selected === mode.value
              ? "border-gray-900 bg-gray-50"
              : "border-gray-200 bg-white hover:border-gray-300"
          }`}
        >
          <div className="font-semibold text-gray-900">{mode.label}</div>
          <div className="text-sm text-gray-500 mt-0.5">{mode.description}</div>
        </button>
      ))}
    </div>
  );
}
