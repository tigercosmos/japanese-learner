import { useDarkMode } from "../hooks/useDarkMode";
import { useSettings } from "../hooks/useSettings";

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const { isDark, toggle: toggleDark } = useDarkMode();
  const { settings, updateSettings } = useSettings();

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-6">設定</h2>

      <div className="space-y-1">
        <div className="flex items-center justify-between py-4 px-4 bg-white dark:bg-gray-800 rounded-t-xl border border-gray-200 dark:border-gray-700">
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-50">深色模式</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">切換深色／淺色主題</div>
          </div>
          <ToggleSwitch checked={isDark} onChange={toggleDark} />
        </div>

        <div className="flex items-center justify-between py-4 px-4 bg-white dark:bg-gray-800 rounded-b-xl border border-t-0 border-gray-200 dark:border-gray-700">
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-50">滑動提示</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">滑動卡片時顯示顏色與文字提示</div>
          </div>
          <ToggleSwitch
            checked={settings.showSwipeAssist}
            onChange={() => updateSettings({ showSwipeAssist: !settings.showSwipeAssist })}
          />
        </div>
      </div>
    </div>
  );
}
