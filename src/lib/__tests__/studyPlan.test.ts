import { describe, it, expect, beforeEach } from "vitest";
import { splitCards } from "../studyPlan";
import { loadStudyPlan, saveStudyPlan, clearStudyPlan } from "../storage";
import type { StudyPlan } from "../../types";

// ========== splitCards ==========

describe("splitCards", () => {
  it("splits cards evenly when divisible", () => {
    const ids = ["a", "b", "c", "d", "e", "f"];
    const result = splitCards(ids, 3);
    expect(result).toEqual([["a", "b"], ["c", "d"], ["e", "f"]]);
  });

  it("ceiling-distributes extra cards to early days (10 / 3 → [4, 3, 3])", () => {
    const ids = Array.from({ length: 10 }, (_, i) => `card-${i}`);
    const result = splitCards(ids, 3);
    expect(result[0]).toHaveLength(4);
    expect(result[1]).toHaveLength(3);
    expect(result[2]).toHaveLength(3);
  });

  it("splits 3 cards into 2 days → [2, 1]", () => {
    const ids = ["a", "b", "c"];
    const result = splitCards(ids, 2);
    expect(result).toEqual([["a", "b"], ["c"]]);
  });

  it("preserves card order within days", () => {
    const ids = ["a", "b", "c", "d"];
    const result = splitCards(ids, 2);
    expect(result[0]).toEqual(["a", "b"]);
    expect(result[1]).toEqual(["c", "d"]);
  });

  it("handles 1 day (all cards in one day)", () => {
    const ids = ["a", "b", "c"];
    const result = splitCards(ids, 1);
    expect(result).toEqual([["a", "b", "c"]]);
  });

  it("returns correct total number of days", () => {
    const ids = Array.from({ length: 20 }, (_, i) => `card-${i}`);
    const result = splitCards(ids, 5);
    expect(result).toHaveLength(5);
  });

  it("all cards are included exactly once", () => {
    const ids = ["a", "b", "c", "d", "e"];
    const result = splitCards(ids, 3);
    const allIds = result.flat();
    expect(allIds.sort()).toEqual([...ids].sort());
  });
});

// ========== Study Plan Storage ==========

describe("study plan storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const mockPlan: StudyPlan = {
    datasetId: "test-vocab",
    totalDays: 3,
    cardIds: [["a", "b"], ["c", "d"], ["e"]],
    createdAt: "2026-02-27T00:00:00.000Z",
  };

  it("returns null when no plan stored", () => {
    expect(loadStudyPlan("test-vocab")).toBeNull();
  });

  it("saves and loads a study plan", () => {
    saveStudyPlan(mockPlan);
    expect(loadStudyPlan("test-vocab")).toEqual(mockPlan);
  });

  it("isolates plans by datasetId", () => {
    const plan2: StudyPlan = { ...mockPlan, datasetId: "other-dataset" };
    saveStudyPlan(mockPlan);
    saveStudyPlan(plan2);
    expect(loadStudyPlan("test-vocab")).toEqual(mockPlan);
    expect(loadStudyPlan("other-dataset")).toEqual(plan2);
  });

  it("overwrites an existing plan on save", () => {
    saveStudyPlan(mockPlan);
    const updated: StudyPlan = { ...mockPlan, totalDays: 5 };
    saveStudyPlan(updated);
    expect(loadStudyPlan("test-vocab")?.totalDays).toBe(5);
  });

  it("clears a stored plan", () => {
    saveStudyPlan(mockPlan);
    clearStudyPlan("test-vocab");
    expect(loadStudyPlan("test-vocab")).toBeNull();
  });

  it("clearStudyPlan does not affect other datasets", () => {
    const plan2: StudyPlan = { ...mockPlan, datasetId: "other-dataset" };
    saveStudyPlan(mockPlan);
    saveStudyPlan(plan2);
    clearStudyPlan("test-vocab");
    expect(loadStudyPlan("other-dataset")).toEqual(plan2);
  });

  it("handles corrupted localStorage gracefully", () => {
    localStorage.setItem("jp-learner:study-plan-test-vocab", "bad json{{{");
    expect(loadStudyPlan("test-vocab")).toBeNull();
  });
});
