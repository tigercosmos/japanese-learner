import { describe, it, expect, beforeEach } from "vitest";
import {
  loadProgress,
  saveProgress,
  loadSettings,
  saveSettings,
  makeProgressKey,
  parseProgressKey,
  loadTestModes,
  saveTestModes,
  loadLearnPosition,
  saveLearnPosition,
  clearLearnPosition,
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
    expect(loadSettings()).toEqual({ defaultSessionSize: 20, showSwipeAssist: true, showFurigana: false });
  });

  it("should save and load settings", () => {
    saveSettings({ defaultSessionSize: 30, showSwipeAssist: false, showFurigana: false });
    expect(loadSettings()).toEqual({ defaultSessionSize: 30, showSwipeAssist: false, showFurigana: false });
  });

  it("should merge with defaults for partial settings", () => {
    localStorage.setItem("jp-learner:settings", JSON.stringify({}));
    expect(loadSettings()).toEqual({ defaultSessionSize: 20, showSwipeAssist: true, showFurigana: false });
  });

  it("should handle corrupted settings gracefully", () => {
    localStorage.setItem("jp-learner:settings", "bad json!");
    expect(loadSettings()).toEqual({ defaultSessionSize: 20, showSwipeAssist: true, showFurigana: false });
  });

  it("should default showSwipeAssist to true when missing from stored settings", () => {
    localStorage.setItem("jp-learner:settings", JSON.stringify({ defaultSessionSize: 15 }));
    const loaded = loadSettings();
    expect(loaded.showSwipeAssist).toBe(true);
    expect(loaded.defaultSessionSize).toBe(15);
  });

  it("should persist showSwipeAssist as false", () => {
    saveSettings({ defaultSessionSize: 20, showSwipeAssist: false });
    expect(loadSettings().showSwipeAssist).toBe(false);
  });
});

describe("makeProgressKey / parseProgressKey", () => {
  it("should return plain cardId when no mode provided", () => {
    expect(makeProgressKey("card-1")).toBe("card-1");
  });

  it("should return composite key when mode provided", () => {
    expect(makeProgressKey("card-1", "kanji-to-chinese")).toBe("card-1::kanji-to-chinese");
  });

  it("should parse plain cardId", () => {
    expect(parseProgressKey("card-1")).toEqual({ cardId: "card-1" });
  });

  it("should parse composite key", () => {
    expect(parseProgressKey("card-1::kanji-to-chinese")).toEqual({
      cardId: "card-1",
      mode: "kanji-to-chinese",
    });
  });

  it("should handle cardId containing colons", () => {
    // Only the first :: is the separator
    expect(parseProgressKey("a::b::c")).toEqual({ cardId: "a", mode: "b::c" });
  });
});

describe("storage - test modes", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should return null when no modes stored", () => {
    expect(loadTestModes("vocabulary")).toBeNull();
  });

  it("should save and load a single mode string", () => {
    saveTestModes("vocabulary", "kanji-to-chinese");
    expect(loadTestModes("vocabulary")).toBe("kanji-to-chinese");
  });

  it("should save and load an array of modes", () => {
    saveTestModes("vocabulary", ["kanji-to-chinese", "hiragana-to-chinese"]);
    expect(loadTestModes("vocabulary")).toEqual(["kanji-to-chinese", "hiragana-to-chinese"]);
  });

  it("should store modes per category independently", () => {
    saveTestModes("vocabulary", "kanji-to-chinese");
    saveTestModes("grammar", ["grammar-to-chinese", "fill-in-grammar"]);
    expect(loadTestModes("vocabulary")).toBe("kanji-to-chinese");
    expect(loadTestModes("grammar")).toEqual(["grammar-to-chinese", "fill-in-grammar"]);
  });

  it("should handle corrupted JSON gracefully", () => {
    localStorage.setItem("jp-learner:test-mode", "not valid json{{{");
    expect(loadTestModes("vocabulary")).toBeNull();
  });

  it("should be backward compatible with old single-string format", () => {
    // Simulate old format stored by saveTestMode
    localStorage.setItem("jp-learner:test-mode", JSON.stringify({ vocabulary: "random" }));
    expect(loadTestModes("vocabulary")).toBe("random");
  });
});

describe("storage - learn position", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns null when no position stored", () => {
    expect(loadLearnPosition("ds-1")).toBeNull();
  });

  it("saves and loads a position", () => {
    saveLearnPosition({
      datasetId: "ds-1",
      planType: "daily",
      dayIndex: 2,
      cardIndex: 7,
      updatedAt: "2026-04-26T12:00:00.000Z",
    });
    expect(loadLearnPosition("ds-1")).toEqual({
      datasetId: "ds-1",
      planType: "daily",
      dayIndex: 2,
      cardIndex: 7,
      updatedAt: "2026-04-26T12:00:00.000Z",
    });
  });

  it("scopes positions per dataset", () => {
    saveLearnPosition({ datasetId: "ds-1", planType: "all", dayIndex: 0, cardIndex: 5, updatedAt: "x" });
    saveLearnPosition({ datasetId: "ds-2", planType: "daily", dayIndex: 1, cardIndex: 2, updatedAt: "y" });
    expect(loadLearnPosition("ds-1")?.cardIndex).toBe(5);
    expect(loadLearnPosition("ds-2")?.cardIndex).toBe(2);
  });

  it("clearLearnPosition removes the stored entry", () => {
    saveLearnPosition({ datasetId: "ds-1", planType: "all", dayIndex: 0, cardIndex: 3, updatedAt: "x" });
    clearLearnPosition("ds-1");
    expect(loadLearnPosition("ds-1")).toBeNull();
  });

  it("handles corrupted JSON gracefully", () => {
    localStorage.setItem("jp-learner:learn-position-ds-1", "not valid json{{{");
    expect(loadLearnPosition("ds-1")).toBeNull();
  });

  it("rejects payloads with wrong types", () => {
    localStorage.setItem(
      "jp-learner:learn-position-ds-1",
      JSON.stringify({ datasetId: "ds-1", planType: "daily", dayIndex: "2", cardIndex: 1, updatedAt: "x" }),
    );
    expect(loadLearnPosition("ds-1")).toBeNull();
  });

  it("rejects payloads with negative indices", () => {
    localStorage.setItem(
      "jp-learner:learn-position-ds-1",
      JSON.stringify({ datasetId: "ds-1", planType: "all", dayIndex: 0, cardIndex: -1, updatedAt: "x" }),
    );
    expect(loadLearnPosition("ds-1")).toBeNull();
  });

  it("rejects payloads with unknown planType", () => {
    localStorage.setItem(
      "jp-learner:learn-position-ds-1",
      JSON.stringify({ datasetId: "ds-1", planType: "weekly", dayIndex: 0, cardIndex: 0, updatedAt: "x" }),
    );
    expect(loadLearnPosition("ds-1")).toBeNull();
  });

  it("rejects payloads missing required fields", () => {
    localStorage.setItem(
      "jp-learner:learn-position-ds-1",
      JSON.stringify({ datasetId: "ds-1", planType: "all" }),
    );
    expect(loadLearnPosition("ds-1")).toBeNull();
  });
});
