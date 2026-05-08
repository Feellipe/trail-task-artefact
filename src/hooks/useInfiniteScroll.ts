/**
 * IntersectionObserver wrapper for infinite scroll.
 * Triggers fetch when a sentinel element nears the viewport.
 */
"use client";

import { useEffect } from "react";

export function useInfiniteScroll({
  sentinelRef,
  onIntersect,
  hasNextPage,
  isFetchingNextPage,
}: {
  sentinelRef: React.RefObject<HTMLDivElement | null>;
  onIntersect: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
}) {
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Only fire when visible, more pages exist, and no fetch is in flight.
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          onIntersect();
        }
      },
      // Trigger 200px before the element enters the viewport — preload buffer.
      { root: null, rootMargin: "200px", threshold: 0 }
    );

    observer.observe(el);

    // Clean up observer on unmount or dependency change.
    return () => observer.disconnect();
  }, [sentinelRef, onIntersect, hasNextPage, isFetchingNextPage]);
}
