import { useCallback, useRef, useState } from "react";

import type { Identifiable } from "./types.js";

export interface UseReelSwiperOptions<T extends Identifiable> {
  items: T[];
  onActiveChange?: (item: T) => void;
}

export interface UseReelSwiperResult<T extends Identifiable> {
  activeItem: T | null;
  /** Props for the FlatList to enable paging and detect active items */
  getSwiperProps: () => {
    pagingEnabled: boolean;
    showsVerticalScrollIndicator: boolean;
    onViewableItemsChanged: (info: { viewableItems: Array<{ item: any; isViewable: boolean }> }) => void;
    viewabilityConfig: { itemVisiblePercentThreshold: number };
  };
}

/**
 * Headless reel swiper for React Native.
 * Uses FlatList viewability callbacks instead of IntersectionObserver.
 */
export function useReelSwiper<T extends Identifiable>(options: UseReelSwiperOptions<T>): UseReelSwiperResult<T> {
  const { items, onActiveChange } = options;
  const [activeId, setActiveId] = useState<string | number | null>(items[0]?.id ?? null);
  const onActiveChangeRef = useRef(onActiveChange);
  onActiveChangeRef.current = onActiveChange;

  const onViewableItemsChanged = useCallback((info: { viewableItems: Array<{ item: any; isViewable: boolean }> }) => {
    const active = info.viewableItems.find((v) => v.isViewable);
    if (active && active.item) {
      setActiveId(active.item.id);
      onActiveChangeRef.current?.(active.item);
    }
  }, []);

  const getSwiperProps = useCallback(() => ({
    pagingEnabled: true,
    showsVerticalScrollIndicator: false,
    onViewableItemsChanged,
    viewabilityConfig: {
      itemVisiblePercentThreshold: 50,
    },
  }), [onViewableItemsChanged]);

  const activeItem = items.find((i) => i.id === activeId) ?? items[0] ?? null;

  return {
    activeItem,
    getSwiperProps,
  };
}
