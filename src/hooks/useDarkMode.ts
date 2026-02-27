import { useState, useEffect } from "react";

const DARK_MODE_KEY = "jp-learner:dark-mode";

export function useDarkMode() {
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem(DARK_MODE_KEY);
    if (stored !== null) return stored === "true";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem(DARK_MODE_KEY, String(isDark));
  }, [isDark]);

  // Follow system preference changes when no explicit preference is stored
  useEffect(() => {
    const stored = localStorage.getItem(DARK_MODE_KEY);
    if (stored !== null) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const toggle = () => setIsDark((prev) => !prev);

  return { isDark, toggle };
}
