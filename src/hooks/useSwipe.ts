import { useRef, useEffect, useState } from "react";
import type { Rating } from "../types";

export interface SwipeState {
  offsetX: number;
  offsetY: number;
  swiping: boolean;
  direction: Rating | null;
}

interface UseSwipeOptions {
  onSwipe: (rating: Rating) => void;
  enabled: boolean;
  threshold?: number;
  /** Change this value to force re-attaching listeners (e.g. when the target element remounts) */
  key?: number | string;
}

const THRESHOLD_DEFAULT = 80;
const MOVE_THRESHOLD = 5; // px to distinguish tap from drag

export function getDirection(dx: number, dy: number, threshold: number): Rating | null {
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  if (absDx < threshold && absDy < threshold) return null;

  // Down swipe dominates when vertical movement is greater
  if (absDy > absDx && dy > 0) return "hard";
  // Horizontal swipe
  if (absDx >= absDy) {
    if (dx < -threshold) return "again"; // Left → 不會
    if (dx > threshold) return "good";   // Right → 記住了
  }

  return null;
}

export function useSwipe({ onSwipe, enabled, threshold = THRESHOLD_DEFAULT, key }: UseSwipeOptions) {
  const [swipeState, setSwipeState] = useState<SwipeState>({
    offsetX: 0,
    offsetY: 0,
    swiping: false,
    direction: null,
  });

  const startPos = useRef<{ x: number; y: number } | null>(null);
  const isDragging = useRef(false);
  const hasMoved = useRef(false);
  const currentDirection = useRef<Rating | null>(null);
  const targetRef = useRef<HTMLDivElement>(null);
  const onSwipeRef = useRef(onSwipe);
  onSwipeRef.current = onSwipe;

  // Reset when disabled
  useEffect(() => {
    if (!enabled) {
      isDragging.current = false;
      startPos.current = null;
      currentDirection.current = null;
      hasMoved.current = false;
      setSwipeState({ offsetX: 0, offsetY: 0, swiping: false, direction: null });
    }
  }, [enabled]);

  // Attach event listeners — re-runs when `key` changes (new card mounted)
  useEffect(() => {
    const el = targetRef.current;
    if (!el || !enabled) return;

    const handleStart = (clientX: number, clientY: number) => {
      startPos.current = { x: clientX, y: clientY };
      isDragging.current = true;
      hasMoved.current = false;
      currentDirection.current = null;
      setSwipeState({ offsetX: 0, offsetY: 0, swiping: true, direction: null });
    };

    const handleMove = (clientX: number, clientY: number) => {
      if (!isDragging.current || !startPos.current) return;
      const dx = clientX - startPos.current.x;
      const dy = clientY - startPos.current.y;

      if (!hasMoved.current && (Math.abs(dx) > MOVE_THRESHOLD || Math.abs(dy) > MOVE_THRESHOLD)) {
        hasMoved.current = true;
      }

      const dir = getDirection(dx, dy, threshold);
      currentDirection.current = dir;
      setSwipeState({ offsetX: dx, offsetY: dy, swiping: true, direction: dir });
    };

    const handleEnd = () => {
      if (!isDragging.current) return;
      const dir = currentDirection.current;
      const didMove = hasMoved.current;

      isDragging.current = false;
      startPos.current = null;
      currentDirection.current = null;
      hasMoved.current = false;
      setSwipeState({ offsetX: 0, offsetY: 0, swiping: false, direction: null });

      if (dir) {
        onSwipeRef.current(dir);
      }

      // If the user dragged (not a tap), block the upcoming click event
      // so it doesn't trigger card flip
      if (didMove) {
        const blockClick = (e: Event) => {
          e.stopPropagation();
          e.preventDefault();
        };
        el.addEventListener("click", blockClick, { capture: true, once: true });
      }
    };

    // Touch events
    const onTouchStart = (e: TouchEvent) => {
      handleStart(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onTouchMove = (e: TouchEvent) => {
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
      if (isDragging.current) e.preventDefault();
    };
    const onTouchEnd = () => handleEnd();
    const onTouchCancel = () => {
      isDragging.current = false;
      startPos.current = null;
      currentDirection.current = null;
      hasMoved.current = false;
      setSwipeState({ offsetX: 0, offsetY: 0, swiping: false, direction: null });
    };

    // Mouse events (desktop drag)
    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      handleStart(e.clientX, e.clientY);
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      if (hasMoved.current) e.preventDefault();
      handleMove(e.clientX, e.clientY);
    };
    const onMouseUp = () => handleEnd();

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("touchcancel", onTouchCancel);
    el.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchCancel);
      el.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, threshold, key]);

  return { targetRef, swipeState };
}
