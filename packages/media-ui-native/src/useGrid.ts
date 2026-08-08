import { useCallback, useRef, useEffect } from "react";

import type { Identifiable } from "./types.js";

export interface UseGridOptions {
  hasNextPage: boolean;
  loading: boolean;
  onLoadMore: () => void;
  /** Distance from bottom (0 to 1) to trigger load. Default 0.5 */
  endReachedThreshold?: number;
}

export interface UseGridResult<T extends Identifiable> {
  getKeyExtractor: () => (item: T) => string;
  getOnEndReached: () => () => void;
  getOnEndReachedThreshold: () => number;
}

/**
 * Headless infinite-scroll grid for React Native.
 * Ships no markup and no styles — returns prop-getters for FlatList.
 */
export function useGrid<T extends Identifiable>(options: UseGridOptions): UseGridResult<T> {
  const { hasNextPage, loading, onLoadMore, endReachedThreshold = 0.5 } = options;
  
  const latestArgs = useRef({ hasNextPage, loading, onLoadMore });
  useEffect(() => {
    latestArgs.current = { hasNextPage, loading, onLoadMore };
  }, [hasNextPage, loading, onLoadMore]);

  const getKeyExtractor = useCallback(() => {
    return (item: T) => String(item.id);
  }, []);

  const getOnEndReached = useCallback(() => {
    return () => {
      const { hasNextPage: hnp, loading: isLoading, onLoadMore: load } = latestArgs.current;
      if (hnp && !isLoading) {
        load();
      }
    };
  }, []);

  const getOnEndReachedThreshold = useCallback(() => {
    return endReachedThreshold;
  }, [endReachedThreshold]);

  return {
    getKeyExtractor,
    getOnEndReached,
    getOnEndReachedThreshold,
  };
}
