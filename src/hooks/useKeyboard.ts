import { useEffect } from "react";
import type { Rating } from "../types";

interface UseKeyboardOptions {
  isFlipped: boolean;
  onFlip: () => void;
  onRate: (rating: Rating) => void;
  enabled?: boolean;
}

/**
 * Keyboard shortcuts for study session:
 * - Space / Enter: flip card
 * - 1: rate "不會" (again)
 * - 2: rate "還好" (hard)
 * - 3: rate "記住了" (good)
 */
export function useKeyboard({ isFlipped, onFlip, onRate, enabled = true }: UseKeyboardOptions) {
  useEffect(() => {
    if (!enabled) return;

    const handler = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        onFlip();
      } else if (isFlipped) {
        switch (e.key) {
          case "1":
            e.preventDefault();
            onRate("again");
            break;
          case "2":
            e.preventDefault();
            onRate("hard");
            break;
          case "3":
            e.preventDefault();
            onRate("good");
            break;
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isFlipped, onFlip, onRate, enabled]);
}
