// Native Intersection Observer, per section 3.4 of the project doc:
// "Infinite scroll pagination (Intersection Observer API — no library)."
//
// Usage: const sentinelRef = useInfiniteScroll({ hasMore, loading, onLoadMore });
// then render <div ref={sentinelRef} /> as the last element in the list —
// once it scrolls into view, onLoadMore fires.

import { useRef, useCallback } from 'react';

export function useInfiniteScroll({ hasMore, loading, onLoadMore }) {
  const observerRef = useRef(null);

  const sentinelRef = useCallback(
    (node) => {
      if (loading) return; // don't trigger another load while one is in flight
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          onLoadMore();
        }
      });

      if (node) observerRef.current.observe(node);
    },
    [hasMore, loading, onLoadMore]
  );

  return sentinelRef;
}
