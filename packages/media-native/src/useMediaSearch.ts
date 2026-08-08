import { useCallback, useEffect, useRef, useState } from "react";
import type { MediaItem, MediaPhoto, MediaVideo } from "media-core";
import { useMediaClient } from "./MediaProvider.js";

export type MediaSearchKind = "photo" | "video";

export interface UseMediaSearchOptions {
  kind: MediaSearchKind;
  perPage?: number;
  /** if false, the hook won't fire automatically when `query` changes — call `search()` yourself */
  enabled?: boolean;
}

export interface UseMediaSearchResult<T extends MediaItem> {
  items: T[];
  loading: boolean;
  /** true only for the *first* page of a fresh query, as distinct from loading a subsequent page */
  isInitialLoading: boolean;
  error: Error | null;
  hasNextPage: boolean;
  loadMore: () => void;
  refresh: () => void;
}

/**
 * Search (photos or videos) against media-core, with pagination and
 * request-cancellation baked in. All business logic (pagination math,
 * caching, HTTP) lives in media-core — this hook only adapts that to
 * React state + effects.
 */
export function useMediaSearch<T extends MediaItem = MediaPhoto | MediaVideo>(
  query: string,
  options: UseMediaSearchOptions
): UseMediaSearchResult<T> {
  const client = useMediaClient();
  const { kind, perPage = 20, enabled = true } = options;

  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  const runSearch = useCallback(
    async (targetPage: number, replace: boolean) => {
      if (!enabled || !query.trim()) {
        setItems([]);
        setHasNextPage(false);
        return;
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const requestId = ++requestIdRef.current;

      setLoading(true);
      if (replace) setIsInitialLoading(true);
      setError(null);

      try {
        const fn = kind === "photo" ? client.searchPhotos : client.searchVideos;
        const result = await fn(query, { page: targetPage, perPage, signal: controller.signal });
        if (requestId !== requestIdRef.current) return; // a newer request superseded this one

        setItems((prev) => (replace ? (result.items as T[]) : [...prev, ...(result.items as T[])]));
        setHasNextPage(result.hasNextPage);
        setPage(targetPage);
      } catch (err) {
        if (requestId !== requestIdRef.current) return;
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
          setIsInitialLoading(false);
        }
      }
    },
    [client, kind, query, perPage, enabled]
  );

  useEffect(() => {
    runSearch(1, true);
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, kind, enabled]);

  const loadMore = useCallback(() => {
    if (loading || !hasNextPage) return;
    runSearch(page + 1, false);
  }, [loading, hasNextPage, page, runSearch]);

  const refresh = useCallback(() => runSearch(1, true), [runSearch]);

  return { items, loading, isInitialLoading, error, hasNextPage, loadMore, refresh };
}
