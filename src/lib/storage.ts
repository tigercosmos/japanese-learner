import type { ProgressStore, StudyPlan, CustomDataStore, Category } from "../types";
import type { SyncMetadata } from "./google/syncTypes";
import { SYNC_META_KEY } from "./google/syncTypes";

const PROGRESS_KEY = "jp-learner:progress";
const SETTINGS_KEY = "jp-learner:settings";
const CUSTOM_DATA_KEY = "jp-learner:custom-data";

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
  notifySyncNeeded();
}

// ========== Settings ==========

export interface AppSettings {
  defaultSessionSize: number;
  showSwipeAssist: boolean;
  showFurigana: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  defaultSessionSize: 20,
  showSwipeAssist: true,
  showFurigana: false,
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
  notifySyncNeeded();
}

// ========== Progress Key Helpers (multi-mode) ==========

export function makeProgressKey(cardId: string, mode?: string): string {
  return mode ? `${cardId}::${mode}` : cardId;
}

export function parseProgressKey(key: string): { cardId: string; mode?: string } {
  const idx = key.indexOf("::");
  if (idx === -1) return { cardId: key };
  return { cardId: key.slice(0, idx), mode: key.slice(idx + 2) };
}

// ========== Test Mode Preference ==========

const TEST_MODE_KEY = "jp-learner:test-mode";

export function loadTestModes(category: Category): string | string[] | null {
  try {
    const raw = localStorage.getItem(TEST_MODE_KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw);
    const val = stored[category];
    if (val == null) return null;
    // Backward compatible: old string values still load correctly
    return val;
  } catch {
    return null;
  }
}

export function saveTestModes(category: Category, modes: string | string[]): void {
  try {
    const raw = localStorage.getItem(TEST_MODE_KEY);
    const stored = raw ? JSON.parse(raw) : {};
    stored[category] = modes;
    localStorage.setItem(TEST_MODE_KEY, JSON.stringify(stored));
    notifySyncNeeded();
  } catch {
    // ignore
  }
}

/** @deprecated Use loadTestModes instead */
export const loadTestMode = (category: Category): string | null => {
  const val = loadTestModes(category);
  if (Array.isArray(val)) return val[0] ?? null;
  return val;
};

/** @deprecated Use saveTestModes instead */
export const saveTestMode = (category: Category, mode: string): void => {
  saveTestModes(category, mode);
};

// ========== Study Plan ==========

function studyPlanKey(datasetId: string): string {
  return `jp-learner:study-plan-${datasetId}`;
}

export function loadStudyPlan(datasetId: string): StudyPlan | null {
  try {
    const raw = localStorage.getItem(studyPlanKey(datasetId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveStudyPlan(plan: StudyPlan): void {
  localStorage.setItem(studyPlanKey(plan.datasetId), JSON.stringify(plan));
  notifySyncNeeded();
}

export function clearStudyPlan(datasetId: string): void {
  localStorage.removeItem(studyPlanKey(datasetId));
  notifySyncNeeded();
}

// ========== Custom Data ==========

const customDataListeners = new Set<() => void>();
let customDataVersion = 0;

export function subscribeCustomData(cb: () => void): () => void {
  customDataListeners.add(cb);
  return () => customDataListeners.delete(cb);
}

export function getCustomDataSnapshot(): number {
  return customDataVersion;
}

function notifyCustomDataChange(): void {
  customDataVersion++;
  customDataListeners.forEach((fn) => fn());
}

export function loadCustomData(): CustomDataStore {
  try {
    const raw = localStorage.getItem(CUSTOM_DATA_KEY);
    return raw ? JSON.parse(raw) : { datasets: {} };
  } catch {
    return { datasets: {} };
  }
}

export function saveCustomData(store: CustomDataStore): void {
  localStorage.setItem(CUSTOM_DATA_KEY, JSON.stringify(store));
  notifyCustomDataChange();
  notifySyncNeeded();
}

export function generateId(prefix: string): string {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 6);
  return `${prefix}-${ts}-${rand}`;
}

// ========== Sync Notification ==========

const syncListeners = new Set<() => void>();

export function subscribeSyncNeeded(cb: () => void): () => void {
  syncListeners.add(cb);
  return () => syncListeners.delete(cb);
}

export function notifySyncNeeded(): void {
  syncListeners.forEach((fn) => {
    try { fn(); } catch { /* listener errors must not break callers */ }
  });
}

// ========== Sync Metadata ==========

export function loadSyncMetadata(): SyncMetadata | null {
  try {
    const raw = localStorage.getItem(SYNC_META_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveSyncMetadata(meta: SyncMetadata): void {
  localStorage.setItem(SYNC_META_KEY, JSON.stringify(meta));
}

export function clearSyncMetadata(): void {
  localStorage.removeItem(SYNC_META_KEY);
}

// ========== Study Plan Key Enumeration (for sync) ==========

export const STUDY_PLAN_PREFIX = "jp-learner:study-plan-";

export function getAllStudyPlanKeys(): string[] {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(STUDY_PLAN_PREFIX)) keys.push(key);
  }
  return keys;
}

export function getDatasetIdFromPlanKey(key: string): string {
  return key.slice(STUDY_PLAN_PREFIX.length);
}

// ========== Raw localStorage Keys (for sync engine) ==========

export const STORAGE_KEYS = {
  progress: PROGRESS_KEY,
  settings: SETTINGS_KEY,
  customData: CUSTOM_DATA_KEY,
  testMode: TEST_MODE_KEY,
} as const;
