import { describe, it, expect } from "vitest";
import { shuffle } from "../shuffle";

describe("shuffle", () => {
  it("should return a new array (not mutate the original)", () => {
    const original = [1, 2, 3, 4, 5];
    const result = shuffle(original);

    expect(result).not.toBe(original); // Different reference
    expect(original).toEqual([1, 2, 3, 4, 5]); // Original unchanged
  });

  it("should contain all original elements", () => {
    const original = [1, 2, 3, 4, 5];
    const result = shuffle(original);

    expect(result).toHaveLength(original.length);
    expect(result.sort()).toEqual(original.sort());
  });

  it("should handle empty array", () => {
    expect(shuffle([])).toEqual([]);
  });

  it("should handle single-element array", () => {
    expect(shuffle([42])).toEqual([42]);
  });

  it("should produce a different order at least sometimes", () => {
    const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    // Run shuffle 10 times; at least one should differ from the original order
    const results = Array.from({ length: 10 }, () => shuffle(original));
    const allSame = results.every(
      (r) => JSON.stringify(r) === JSON.stringify(original),
    );
    expect(allSame).toBe(false);
  });

  it("should work with generic types", () => {
    const strings = ["a", "b", "c"];
    const result = shuffle(strings);
    expect(result).toHaveLength(3);
    expect(result.sort()).toEqual(["a", "b", "c"]);
  });
});
