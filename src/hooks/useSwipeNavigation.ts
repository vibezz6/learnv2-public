import { useCallback, useRef, type TouchEvent } from "react";

interface SwipeNavigationOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
}

/**
 * Hook for swipe-based navigation on mobile.
 * Swipe left → next lesson, swipe right → previous lesson.
 * Ignores vertical swipes (scrolling) and short swipes (taps).
 */
export function useSwipeNavigation({
  onSwipeLeft,
  onSwipeRight,
  threshold = 60,
}: SwipeNavigationOptions) {
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchEndX = useRef(0);
  const touchEndY = useRef(0);

  const onTouchStart = useCallback((e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchEndX.current = e.touches[0].clientX;
    touchEndY.current = e.touches[0].clientY;
  }, []);

  const onTouchMove = useCallback((e: TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
    touchEndY.current = e.touches[0].clientY;
  }, []);

  const onTouchEnd = useCallback(() => {
    const dx = touchEndX.current - touchStartX.current;
    const dy = touchEndY.current - touchStartY.current;

    if (Math.abs(dy) > Math.abs(dx)) return;
    if (Math.abs(dx) < threshold) return;

    if (dx < 0 && onSwipeLeft) {
      onSwipeLeft();
    } else if (dx > 0 && onSwipeRight) {
      onSwipeRight();
    }
  }, [onSwipeLeft, onSwipeRight, threshold]);

  return { onTouchStart, onTouchMove, onTouchEnd };
}
