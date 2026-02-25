import type { ProgressStore } from "../types";

const PROGRESS_KEY = "jp-learner:progress";
const SETTINGS_KEY = "jp-learner:settings";

// ========== Progress ==========

export function loadProgress(): ProgressStore {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveProgress(progress: ProgressStore): void {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

// ========== Settings ==========

export interface AppSettings {
  defaultSessionSize: number;
}

const DEFAULT_SETTINGS: AppSettings = {
  defaultSessionSize: 20,
};

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
