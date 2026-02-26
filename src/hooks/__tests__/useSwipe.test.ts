import { describe, it, expect } from "vitest";
import { getDirection } from "../useSwipe";

const THRESHOLD = 80;

describe("getDirection", () => {
  it("should return null when movement is below threshold", () => {
    expect(getDirection(50, 30, THRESHOLD)).toBeNull();
    expect(getDirection(-70, 20, THRESHOLD)).toBeNull();
    expect(getDirection(0, 0, THRESHOLD)).toBeNull();
    expect(getDirection(79, 79, THRESHOLD)).toBeNull();
  });

  it("should return 'good' for right swipe", () => {
    expect(getDirection(100, 0, THRESHOLD)).toBe("good");
    expect(getDirection(200, 50, THRESHOLD)).toBe("good");
    expect(getDirection(81, 0, THRESHOLD)).toBe("good");
  });

  it("should return 'again' for left swipe", () => {
    expect(getDirection(-100, 0, THRESHOLD)).toBe("again");
    expect(getDirection(-200, 50, THRESHOLD)).toBe("again");
    expect(getDirection(-81, 0, THRESHOLD)).toBe("again");
  });

  it("should return 'hard' for down swipe", () => {
    expect(getDirection(0, 100, THRESHOLD)).toBe("hard");
    expect(getDirection(50, 200, THRESHOLD)).toBe("hard");
    expect(getDirection(0, 81, THRESHOLD)).toBe("hard");
  });

  it("should return null for upward swipe (not mapped)", () => {
    expect(getDirection(0, -100, THRESHOLD)).toBeNull();
    expect(getDirection(0, -200, THRESHOLD)).toBeNull();
  });

  it("should prefer horizontal when dx == dy and both exceed threshold", () => {
    // When absDx >= absDy, horizontal wins
    expect(getDirection(100, 100, THRESHOLD)).toBe("good");
    expect(getDirection(-100, 100, THRESHOLD)).toBe("again");
  });

  it("should prefer vertical (down) when dy > dx", () => {
    expect(getDirection(80, 81, THRESHOLD)).toBe("hard");
    expect(getDirection(-50, 100, THRESHOLD)).toBe("hard");
  });

  it("should work with custom threshold", () => {
    expect(getDirection(30, 0, 20)).toBe("good");
    expect(getDirection(-30, 0, 20)).toBe("again");
    expect(getDirection(0, 30, 20)).toBe("hard");
    expect(getDirection(15, 0, 20)).toBeNull();
  });
});
