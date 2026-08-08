import { useCallback, useEffect, useRef, useState } from "react";
import type { MediaPhoto, MediaVideo } from "media-core";
import { useMediaClient } from "./MediaProvider.js";

export type UseMediaFeedKind = "photo" | "video";

export interface UseMediaFeedResult<T> {
  items: T[];
  loading: boolean;
  isInitialLoading: boolean;
  error: Error | null;
  hasNextPage: boolean;
  loadMore: () => void;
}

/**
 * The "default" feed shown before a user searches — curated photos or
 * popular videos. Same shape as useMediaSearch on purpose, so a Grid
 * component consuming either hook doesn't need to branch.
 */
export function useMediaFeed<T = MediaPhoto | MediaVideo>(kind: UseMediaFeedKind, perPage = 20): UseMediaFeedResult<T> {
  const client = useMediaClient();
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const requestIdRef = useRef(0);

  const run = useCallback(
    async (targetPage: number, replace: boolean) => {
      const requestId = ++requestIdRef.current;
      setLoading(true);
      if (replace) setIsInitialLoading(true);
      setError(null);
      try {
        const fn = kind === "photo" ? client.curatedPhotos : client.popularVideos;
        const result = await fn({ page: targetPage, perPage });
        if (requestId !== requestIdRef.current) return;
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
    [client, kind, perPage]
  );

  useEffect(() => {
    run(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  const loadMore = useCallback(() => {
    if (loading || !hasNextPage) return;
    run(page + 1, false);
  }, [loading, hasNextPage, page, run]);

  return { items, loading, isInitialLoading, error, hasNextPage, loadMore };
}
