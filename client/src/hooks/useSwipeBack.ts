/**
 * useSwipeBack — enables iOS-style swipe-from-left-edge to go back.
 * Only triggers when the touch starts within 30px of the left edge
 * and the horizontal swipe distance exceeds 60px, preventing conflicts
 * with horizontal scroll carousels and other touch interactions.
 */
import { useEffect } from "react";

export function useSwipeBack() {
  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let tracking = false;

    const onTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      // Only track swipes that start within 30px of the left edge
      tracking = startX < 30;
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!tracking) return;
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - startX;
      const deltaY = Math.abs(touch.clientY - startY);

      // Require a clear rightward swipe (>60px) that isn't mostly vertical
      if (deltaX > 60 && deltaY < 80) {
        window.history.back();
      }
      tracking = false;
    };

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, []);
}
