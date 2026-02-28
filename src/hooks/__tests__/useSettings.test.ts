import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSettings } from "../useSettings";

describe("useSettings", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should return default settings", () => {
    const { result } = renderHook(() => useSettings());
    expect(result.current.settings).toEqual({
      defaultSessionSize: 20,
      showSwipeAssist: true,
    });
  });

  it("should update settings and persist to localStorage", () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.updateSettings({ showSwipeAssist: false });
    });

    expect(result.current.settings.showSwipeAssist).toBe(false);
    expect(result.current.settings.defaultSessionSize).toBe(20);

    const stored = JSON.parse(localStorage.getItem("jp-learner:settings")!);
    expect(stored.showSwipeAssist).toBe(false);
  });

  it("should load previously saved settings", () => {
    localStorage.setItem(
      "jp-learner:settings",
      JSON.stringify({ defaultSessionSize: 10, showSwipeAssist: false })
    );

    const { result } = renderHook(() => useSettings());
    expect(result.current.settings.defaultSessionSize).toBe(10);
    expect(result.current.settings.showSwipeAssist).toBe(false);
  });

  it("should partially update settings without losing other fields", () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.updateSettings({ defaultSessionSize: 50 });
    });

    expect(result.current.settings.defaultSessionSize).toBe(50);
    expect(result.current.settings.showSwipeAssist).toBe(true);
  });
});
