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
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          onIntersect();
        }
      },
      { root: null, rootMargin: "200px", threshold: 0 }
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, [sentinelRef, onIntersect, hasNextPage, isFetchingNextPage]);
}
