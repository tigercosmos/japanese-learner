import { useState, useCallback } from "react";
import type { CardProgress, ProgressStore, Rating } from "../types";
import { loadProgress, saveProgress } from "../lib/storage";
import { calculateNextReview } from "../lib/sm2";

export function useProgress() {
  const [progress, setProgress] = useState<ProgressStore>(() => loadProgress());

  const getCardProgress = useCallback(
    (cardId: string): CardProgress | undefined => {
      return progress[cardId];
    },
    [progress],
  );

  const rateCard = useCallback(
    (cardId: string, datasetId: string, rating: Rating): CardProgress => {
      const current = progress[cardId] ?? null;
      const updated = calculateNextReview(current, cardId, datasetId, rating);

      const newProgress = { ...progress, [cardId]: updated };
      setProgress(newProgress);
      saveProgress(newProgress);
      return updated;
    },
    [progress],
  );

  const resetProgress = useCallback(() => {
    setProgress({});
    saveProgress({});
  }, []);

  return { progress, getCardProgress, rateCard, resetProgress };
}
