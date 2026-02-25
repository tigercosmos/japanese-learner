import type { DataItem, ProgressStore, CardProgress } from "../types";
import { isDue } from "./sm2";

export interface DatasetStats {
  totalCards: number;
  learnedCards: number;   // cards with at least one review
  dueCards: number;       // cards currently due for review
  masteredCards: number;  // cards with repetitions >= 3
  masteryPercent: number; // percentage of mastered cards (0–100)
}

/**
 * Compute statistics for a dataset based on progress data.
 */
export function getDatasetStats(
  data: DataItem[],
  progress: ProgressStore,
): DatasetStats {
  const totalCards = data.length;
  let learnedCards = 0;
  let dueCards = 0;
  let masteredCards = 0;

  for (const item of data) {
    const p: CardProgress | undefined = progress[item.id];
    if (p) {
      learnedCards++;
      if (p.repetitions >= 3) {
        masteredCards++;
      }
    }
    if (isDue(p)) {
      dueCards++;
    }
  }

  const masteryPercent = totalCards > 0 ? Math.round((masteredCards / totalCards) * 100) : 0;

  return { totalCards, learnedCards, dueCards, masteredCards, masteryPercent };
}
