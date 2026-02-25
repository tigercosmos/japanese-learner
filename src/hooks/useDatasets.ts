import type { Dataset, DatasetMeta } from "../types";
import { loadProgress } from "../lib/storage";
import { getDatasetStats } from "../lib/stats";

// Eagerly import all JSON files from the data directory (synchronous)
const dataModules = import.meta.glob<Dataset>("../../data/*.json", { eager: true });

function getDatasetId(path: string): string {
  // "../../data/vocab-n3.json" → "vocab-n3"
  const filename = path.split("/").pop() ?? "";
  return filename.replace(/\.json$/, "");
}

export interface LoadedDataset extends Dataset {
  id: string;
}

// Build the dataset list once at module load time (synchronous)
const allDatasets: LoadedDataset[] = Object.entries(dataModules).map(([path, mod]) => {
  const ds = (mod as { default?: Dataset }).default ?? (mod as Dataset);
  return {
    ...ds,
    id: getDatasetId(path),
  };
});

export function useDatasets(): LoadedDataset[] {
  return allDatasets;
}

export function useDatasetById(id: string): LoadedDataset | undefined {
  return allDatasets.find((ds) => ds.id === id);
}

export function useDatasetMetas(
  categoryFilter?: string,
  levelFilter?: string,
): DatasetMeta[] {
  // No useMemo — always reads fresh progress from localStorage
  // so that due counts update after study sessions.
  const progress = loadProgress();

  return allDatasets
    .filter((ds) => {
      if (categoryFilter && ds.category !== categoryFilter) return false;
      if (levelFilter && ds.level !== levelFilter) return false;
      return true;
    })
    .map((ds) => {
      const stats = getDatasetStats(ds.data, progress);
      return {
        id: ds.id,
        name: ds.name,
        category: ds.category,
        level: ds.level,
        totalCards: stats.totalCards,
        dueCards: stats.dueCards,
        learnedCards: stats.learnedCards,
        masteredCards: stats.masteredCards,
      };
    });
}
