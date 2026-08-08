import { useCallback, useEffect, useRef } from "react";
import type { Identifiable } from "./types.js";

export interface UseGridOptions {
  hasNextPage: boolean;
  loading: boolean;
  onLoadMore: () => void;
  /** IntersectionObserver rootMargin — how far before the end to trigger loadMore. Default "400px". */
  rootMargin?: string;
}

export interface GridItemProps {
  key: string;
  role: "listitem";
  "data-item-id": string;
  tabIndex: 0;
}

export interface UseGridResult<T extends Identifiable> {
  /** spread onto the scrollable/grid container element */
  getContainerProps: () => { role: "list" };
  /** spread onto each rendered item's wrapper element */
  getItemProps: (item: T) => GridItemProps;
  /**
   * Attach this ref to a sentinel element placed after the last item
   * (e.g. `<div ref={sentinelRef} />`). When it scrolls into view and
   * hasNextPage is true, `onLoadMore` fires automatically. This is the
   * entire "infinite scroll" mechanism — no scroll-event listeners.
   */
  sentinelRef: (node: Element | null) => void;
}

/**
 * Headless infinite-scroll grid. Ships no markup and no styles — it only
 * returns prop-getters and a sentinel ref callback. Consumer is free to
 * render a CSS grid, a masonry layout, a flex-wrap list, whatever.
 */
export function useGrid<T extends Identifiable>(options: UseGridOptions): UseGridResult<T> {
  const { hasNextPage, loading, onLoadMore, rootMargin = "400px" } = options;
  const observerRef = useRef<IntersectionObserver | null>(null);
  const latestArgs = useRef({ hasNextPage, loading, onLoadMore });
  latestArgs.current = { hasNextPage, loading, onLoadMore };

  const sentinelRef = useCallback(
    (node: Element | null) => {
      observerRef.current?.disconnect();
      if (!node) return;

      observerRef.current = new IntersectionObserver(
        (entries) => {
          const { hasNextPage: hnp, loading: isLoading, onLoadMore: load } = latestArgs.current;
          if (entries[0]?.isIntersecting && hnp && !isLoading) {
            load();
          }
        },
        { rootMargin }
      );
      observerRef.current.observe(node);
    },
    [rootMargin]
  );

  useEffect(() => () => observerRef.current?.disconnect(), []);

  const getContainerProps = useCallback(() => ({ role: "list" as const }), []);

  const getItemProps = useCallback(
    (item: T): GridItemProps => ({
      key: item.id,
      role: "listitem",
      "data-item-id": item.id,
      tabIndex: 0,
    }),
    []
  );

  return { getContainerProps, getItemProps, sentinelRef };
}
