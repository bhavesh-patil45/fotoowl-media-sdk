import { useCallback, useState } from "react";

import type { Identifiable } from "./types.js";

export interface UseLightboxOptions<T extends Identifiable> {
  items: T[];
  onOpen?: (item: T) => void;
  onClose?: (item: T | null) => void;
  onNavigate?: (item: T, direction: "next" | "prev") => void;
}

export interface UseLightboxResult<T extends Identifiable> {
  isOpen: boolean;
  activeItem: T | null;
  activeIndex: number;
  open: (item: T) => void;
  close: () => void;
  next: () => void;
  prev: () => void;
  hasNext: boolean;
  hasPrev: boolean;

  /** Spread onto the trigger element (e.g. TouchableOpacity) */
  getTriggerProps: (item: T) => {
    onPress: () => void;
    accessibilityRole: "button";
  };
  /** Spread onto the RN Modal */
  getModalProps: () => {
    visible: boolean;
    transparent: boolean;
    onRequestClose: () => void;
  };
}

/**
 * Headless lightbox for React Native.
 * No DOM APIs or DOM event listeners.
 */
export function useLightbox<T extends Identifiable>(options: UseLightboxOptions<T>): UseLightboxResult<T> {
  const { items, onOpen, onClose, onNavigate } = options;
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  const isOpen = activeIndex >= 0 && activeIndex < items.length;
  const activeItem = isOpen ? items[activeIndex] : null;

  const open = useCallback(
    (item: T) => {
      const idx = items.findIndex((i) => i.id === item.id);
      if (idx === -1) return;
      setActiveIndex(idx);
      onOpen?.(item);
    },
    [items, onOpen]
  );

  const close = useCallback(() => {
    const closingItem = isOpen ? items[activeIndex] : null;
    setActiveIndex(-1);
    onClose?.(closingItem);
  }, [isOpen, items, activeIndex, onClose]);

  const next = useCallback(() => {
    setActiveIndex((i) => {
      if (i === -1 || i >= items.length - 1) return i;
      onNavigate?.(items[i + 1], "next");
      return i + 1;
    });
  }, [items, onNavigate]);

  const prev = useCallback(() => {
    setActiveIndex((i) => {
      if (i <= 0) return i;
      onNavigate?.(items[i - 1], "prev");
      return i - 1;
    });
  }, [items, onNavigate]);

  const getTriggerProps = useCallback(
    (item: T) => ({
      onPress: () => open(item),
      accessibilityRole: "button" as const,
    }),
    [open]
  );

  const getModalProps = useCallback(
    () => ({
      visible: isOpen,
      transparent: true,
      onRequestClose: close, // Handles Android hardware back button
    }),
    [isOpen, close]
  );

  return {
    isOpen,
    activeItem,
    activeIndex,
    open,
    close,
    next,
    prev,
    hasNext: isOpen && activeIndex < items.length - 1,
    hasPrev: isOpen && activeIndex > 0,
    getTriggerProps,
    getModalProps,
  };
}
