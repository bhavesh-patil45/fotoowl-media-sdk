import { useCallback, useEffect, useRef, useState } from "react";
import type { Identifiable } from "./types.js";

export interface UseReelSwiperOptions<T extends Identifiable> {
  items: T[];
  onActiveChange?: (item: T, index: number) => void;
  /** fraction of an item that must be visible to count as "active", default 0.6 */
  activeThreshold?: number;
}

export interface UseReelSwiperResult<T extends Identifiable> {
  activeIndex: number;
  activeItem: T | null;
  /** spread onto the scroll container (needs a fixed height in consumer CSS; this hook only sets scroll behavior) */
  getContainerProps: () => {
    style: { overflowY: "scroll"; scrollSnapType: "y mandatory" };
    ref: (node: Element | null) => void;
  };
  /** spread onto each reel item's wrapper; registers it for active-item observation */
  getItemProps: (item: T, index: number) => {
    key: string;
    style: { scrollSnapAlign: "start" };
    ref: (node: Element | null) => void;
  };
  /** imperative escape hatch, e.g. for a "next reel" button */
  scrollToIndex: (index: number) => void;
}

/**
 * Headless vertical reel/snap-swiper: no rendering, just scroll-snap wiring
 * + IntersectionObserver-based "which item is currently active" tracking
 * (rather than scroll-position math, which is jankier and harder to keep
 * correct across item sizes).
 */
export function useReelSwiper<T extends Identifiable>(options: UseReelSwiperOptions<T>): UseReelSwiperResult<T> {
  const { items, onActiveChange, activeThreshold = 0.6 } = options;
  const [activeIndex, setActiveIndex] = useState(0);
  const itemNodesRef = useRef<Map<number, Element>>(new Map());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const containerNodeRef = useRef<Element | null>(null);

  const notifyActive = useCallback(
    (index: number) => {
      setActiveIndex(index);
      if (items[index]) onActiveChange?.(items[index], index);
    },
    [items, onActiveChange]
  );

  const registerObserver = useCallback(() => {
    observerRef.current?.disconnect();
    if (!containerNodeRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting && e.intersectionRatio >= activeThreshold)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const idx = Number((visible.target as HTMLElement).dataset.reelIndex);
        if (!Number.isNaN(idx)) notifyActive(idx);
      },
      { root: containerNodeRef.current, threshold: [0, activeThreshold, 1] }
    );

    itemNodesRef.current.forEach((node) => observerRef.current!.observe(node));
  }, [activeThreshold, notifyActive]);

  const getContainerProps = useCallback(
    () => ({
      style: { overflowY: "scroll" as const, scrollSnapType: "y mandatory" as const },
      ref: (node: Element | null) => {
        containerNodeRef.current = node;
        registerObserver();
      },
    }),
    [registerObserver]
  );

  const getItemProps = useCallback(
    (item: T, index: number) => ({
      key: item.id,
      style: { scrollSnapAlign: "start" as const },
      ref: (node: Element | null) => {
        if (node) {
          (node as HTMLElement).dataset.reelIndex = String(index);
          itemNodesRef.current.set(index, node);
          observerRef.current?.observe(node);
        } else {
          const existing = itemNodesRef.current.get(index);
          if (existing) observerRef.current?.unobserve(existing);
          itemNodesRef.current.delete(index);
        }
      },
    }),
    []
  );

  const scrollToIndex = useCallback((index: number) => {
    const node = itemNodesRef.current.get(index);
    node?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  useEffect(() => () => observerRef.current?.disconnect(), []);

  return {
    activeIndex,
    activeItem: items[activeIndex] ?? null,
    getContainerProps,
    getItemProps,
    scrollToIndex,
  };
}
