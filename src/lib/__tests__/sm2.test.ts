import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { calculateNextReview, isDue } from "../sm2";
import type { CardProgress } from "../../types";

describe("calculateNextReview", () => {
  beforeEach(() => {
    // Mock Date to a fixed date for predictable results
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-06-15"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should create new progress for a first-time 'good' rating", () => {
    const result = calculateNextReview(null, "card-1", "ds-1", "good");

    expect(result.cardId).toBe("card-1");
    expect(result.datasetId).toBe("ds-1");
    expect(result.repetitions).toBe(1);
    expect(result.interval).toBe(1);
    expect(result.lastRating).toBe("good");
    expect(result.nextReview).toBe("2025-06-16");
    // EF = 2.5 + (0.1 - 0 * (0.08 + 0 * 0.02)) = 2.6
    expect(result.easeFactor).toBeCloseTo(2.6, 2);
  });

  it("should reset on 'again' rating", () => {
    const current: CardProgress = {
      cardId: "card-1",
      datasetId: "ds-1",
      easeFactor: 2.5,
      interval: 6,
      repetitions: 2,
      nextReview: "2025-06-15",
      lastRating: "good",
    };

    const result = calculateNextReview(current, "card-1", "ds-1", "again");

    expect(result.repetitions).toBe(0);
    expect(result.interval).toBe(1);
    expect(result.lastRating).toBe("again");
    expect(result.nextReview).toBe("2025-06-16");
    // EF = 2.5 + (0.1 - (5-1) * (0.08 + (5-1) * 0.02)) = 2.5 + (0.1 - 4 * 0.16) = 2.5 - 0.54 = 1.96
    expect(result.easeFactor).toBeCloseTo(1.96, 2);
  });

  it("should increase interval on second 'good' rating", () => {
    const current: CardProgress = {
      cardId: "card-1",
      datasetId: "ds-1",
      easeFactor: 2.6,
      interval: 1,
      repetitions: 1,
      nextReview: "2025-06-15",
      lastRating: "good",
    };

    const result = calculateNextReview(current, "card-1", "ds-1", "good");

    expect(result.repetitions).toBe(2);
    expect(result.interval).toBe(6); // rep 1 → 6 days
    expect(result.nextReview).toBe("2025-06-21");
  });

  it("should use ease factor for third+ 'good' rating", () => {
    const current: CardProgress = {
      cardId: "card-1",
      datasetId: "ds-1",
      easeFactor: 2.5,
      interval: 6,
      repetitions: 2,
      nextReview: "2025-06-15",
      lastRating: "good",
    };

    const result = calculateNextReview(current, "card-1", "ds-1", "good");

    expect(result.repetitions).toBe(3);
    expect(result.interval).toBe(Math.round(6 * 2.5)); // 15
    expect(result.nextReview).toBe("2025-06-30");
  });

  it("should handle 'hard' rating without resetting", () => {
    const current: CardProgress = {
      cardId: "card-1",
      datasetId: "ds-1",
      easeFactor: 2.5,
      interval: 6,
      repetitions: 2,
      nextReview: "2025-06-15",
      lastRating: "good",
    };

    const result = calculateNextReview(current, "card-1", "ds-1", "hard");

    expect(result.repetitions).toBe(3); // incremented
    expect(result.interval).toBe(Math.round(6 * 2.5)); // 15
    expect(result.lastRating).toBe("hard");
    // EF = 2.5 + (0.1 - (5-3) * (0.08 + (5-3) * 0.02)) = 2.5 + (0.1 - 2 * 0.12) = 2.5 - 0.14 = 2.36
    expect(result.easeFactor).toBeCloseTo(2.36, 2);
  });

  it("should never let ease factor go below 1.3", () => {
    // Repeatedly rate "again" to lower the EF
    let result = calculateNextReview(null, "card-1", "ds-1", "again");
    result = calculateNextReview(result, "card-1", "ds-1", "again");
    result = calculateNextReview(result, "card-1", "ds-1", "again");
    result = calculateNextReview(result, "card-1", "ds-1", "again");
    result = calculateNextReview(result, "card-1", "ds-1", "again");

    expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);
  });

  it("should handle first-time 'hard' rating", () => {
    const result = calculateNextReview(null, "card-1", "ds-1", "hard");

    expect(result.repetitions).toBe(1);
    expect(result.interval).toBe(1);
    expect(result.lastRating).toBe("hard");
  });
});

describe("isDue", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-06-15"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return true for undefined progress (new card)", () => {
    expect(isDue(undefined)).toBe(true);
  });

  it("should return true for cards due today", () => {
    const progress: CardProgress = {
      cardId: "card-1",
      datasetId: "ds-1",
      easeFactor: 2.5,
      interval: 1,
      repetitions: 1,
      nextReview: "2025-06-15", // today
      lastRating: "good",
    };
    expect(isDue(progress)).toBe(true);
  });

  it("should return true for overdue cards", () => {
    const progress: CardProgress = {
      cardId: "card-1",
      datasetId: "ds-1",
      easeFactor: 2.5,
      interval: 1,
      repetitions: 1,
      nextReview: "2025-06-10", // past
      lastRating: "good",
    };
    expect(isDue(progress)).toBe(true);
  });

  it("should return false for cards not yet due", () => {
    const progress: CardProgress = {
      cardId: "card-1",
      datasetId: "ds-1",
      easeFactor: 2.5,
      interval: 6,
      repetitions: 2,
      nextReview: "2025-06-20", // future
      lastRating: "good",
    };
    expect(isDue(progress)).toBe(false);
  });
});
