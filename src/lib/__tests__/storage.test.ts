import { describe, it, expect, beforeEach } from "vitest";
import {
  loadProgress,
  saveProgress,
  loadSettings,
  saveSettings,
} from "../storage";
import type { ProgressStore } from "../../types";

describe("storage - progress", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should return empty object when no progress stored", () => {
    expect(loadProgress()).toEqual({});
  });

  it("should save and load progress", () => {
    const progress: ProgressStore = {
      "card-1": {
        cardId: "card-1",
        datasetId: "ds-1",
        easeFactor: 2.5,
        interval: 1,
        repetitions: 1,
        nextReview: "2025-06-15",
        lastRating: "good",
      },
    };

    saveProgress(progress);
    const loaded = loadProgress();
    expect(loaded).toEqual(progress);
  });

  it("should overwrite existing progress", () => {
    const progress1: ProgressStore = {
      "card-1": {
        cardId: "card-1",
        datasetId: "ds-1",
        easeFactor: 2.5,
        interval: 1,
        repetitions: 1,
        nextReview: "2025-06-15",
        lastRating: "good",
      },
    };
    const progress2: ProgressStore = {
      "card-2": {
        cardId: "card-2",
        datasetId: "ds-1",
        easeFactor: 2.6,
        interval: 6,
        repetitions: 2,
        nextReview: "2025-06-20",
        lastRating: "hard",
      },
    };

    saveProgress(progress1);
    saveProgress(progress2);
    expect(loadProgress()).toEqual(progress2);
  });

  it("should handle corrupted localStorage gracefully", () => {
    localStorage.setItem("jp-learner:progress", "not valid json{{{");
    expect(loadProgress()).toEqual({});
  });
});

describe("storage - settings", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should return default settings when nothing stored", () => {
    expect(loadSettings()).toEqual({ defaultSessionSize: 20 });
  });

  it("should save and load settings", () => {
    saveSettings({ defaultSessionSize: 30 });
    expect(loadSettings()).toEqual({ defaultSessionSize: 30 });
  });

  it("should merge with defaults for partial settings", () => {
    localStorage.setItem("jp-learner:settings", JSON.stringify({}));
    expect(loadSettings()).toEqual({ defaultSessionSize: 20 });
  });

  it("should handle corrupted settings gracefully", () => {
    localStorage.setItem("jp-learner:settings", "bad json!");
    expect(loadSettings()).toEqual({ defaultSessionSize: 20 });
  });
});
