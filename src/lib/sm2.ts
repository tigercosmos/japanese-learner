import type { CardProgress, Rating } from "../types";

const RATING_QUALITY: Record<Rating, number> = {
  again: 1,
  hard: 3,
  good: 5,
};

/**
 * SM-2 spaced repetition algorithm (Anki-style).
 * Given current card progress and a rating, returns updated progress.
 */
export function calculateNextReview(
  current: CardProgress | null,
  cardId: string,
  datasetId: string,
  rating: Rating,
): CardProgress {
  const q = RATING_QUALITY[rating];

  let easeFactor = current?.easeFactor ?? 2.5;
  let interval = current?.interval ?? 0;
  let repetitions = current?.repetitions ?? 0;

  if (q < 3) {
    // "Again" — reset
    repetitions = 0;
    interval = 1;
  } else {
    // "Hard" or "Good"
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  }

  // Update ease factor
  easeFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  easeFactor = Math.max(1.3, easeFactor);

  // Calculate next review date
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + interval);
  const nextReview = nextDate.toISOString().split("T")[0];

  return {
    cardId,
    datasetId,
    easeFactor,
    interval,
    repetitions,
    nextReview,
    lastRating: rating,
  };
}

/**
 * Check if a card is due for review.
 */
export function isDue(progress: CardProgress | undefined): boolean {
  if (!progress) return true; // New card
  const today = new Date().toISOString().split("T")[0];
  return progress.nextReview <= today;
}
