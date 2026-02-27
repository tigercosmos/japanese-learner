import { useState } from "react";
import type { StudyPlan } from "../types";
import { loadStudyPlan, saveStudyPlan, clearStudyPlan } from "../lib/storage";
import { splitCards } from "../lib/studyPlan";

export function useStudyPlan(datasetId: string) {
  const [plan, setPlan] = useState<StudyPlan | null>(() => loadStudyPlan(datasetId));

  const createPlan = (allCardIds: string[], totalDays: number): void => {
    if (totalDays === 0) {
      // All at once — no plan stored
      clearStudyPlan(datasetId);
      setPlan(null);
      return;
    }

    const cardIds = splitCards(allCardIds, totalDays);
    const newPlan: StudyPlan = {
      datasetId,
      totalDays,
      cardIds,
      createdAt: new Date().toISOString(),
    };

    saveStudyPlan(newPlan);
    setPlan(newPlan);
  };

  const clearPlan = (): void => {
    clearStudyPlan(datasetId);
    setPlan(null);
  };

  return { plan, createPlan, clearPlan };
}
