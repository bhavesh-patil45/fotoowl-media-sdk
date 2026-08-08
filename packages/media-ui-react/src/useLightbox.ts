import { useCallback, useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
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

  /** spread onto whatever element opens the lightbox for `item` (e.g. a grid thumbnail) */
  getTriggerProps: (item: T) => {
    onClick: () => void;
    "aria-haspopup": "dialog";
    tabIndex: 0;
  };
  /** spread onto the modal/dialog root */
  getOverlayProps: () => {
    role: "dialog";
    "aria-modal": true;
    onClick: (e: ReactMouseEvent) => void;
  };
  /** spread onto the content box, so clicks inside don't bubble to the overlay's close-on-click-outside */
  getContentProps: () => { onClick: (e: ReactMouseEvent) => void };
  /** spread onto the close button; receives initial focus when the lightbox opens */
  getCloseButtonProps: () => { onClick: () => void; "aria-label": string; ref: (node: HTMLElement | null) => void };
}

/**
 * Headless lightbox: open/close/next/prev state, keyboard nav (Escape,
 * ArrowLeft/Right), and basic focus management (focus moves to the close
 * button on open, and returns to the trigger element on close). No DOM is
 * rendered by this hook — everything is prop-getters.
 */
export function useLightbox<T extends Identifiable>(options: UseLightboxOptions<T>): UseLightboxResult<T> {
  const { items, onOpen, onClose, onNavigate } = options;
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const closeButtonRef = useRef<HTMLElement | null>(null);
  const previouslyFocusedRef = useRef<Element | null>(null);

  const isOpen = activeIndex >= 0 && activeIndex < items.length;
  const activeItem = isOpen ? items[activeIndex] : null;

  const open = useCallback(
    (item: T) => {
      const idx = items.findIndex((i) => i.id === item.id);
      if (idx === -1) return;
      previouslyFocusedRef.current = document.activeElement;
      setActiveIndex(idx);
      onOpen?.(item);
    },
    [items, onOpen]
  );

  const close = useCallback(() => {
    const closingItem = isOpen ? items[activeIndex] : null;
    setActiveIndex(-1);
    onClose?.(closingItem);
    (previouslyFocusedRef.current as HTMLElement | null)?.focus?.();
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

  // focus the close button whenever the lightbox transitions to open
  useEffect(() => {
    if (isOpen) closeButtonRef.current?.focus();
  }, [isOpen]);

  // keyboard handling
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, close, next, prev]);

  const getTriggerProps = useCallback(
    (item: T) => ({
      onClick: () => open(item),
      "aria-haspopup": "dialog" as const,
      tabIndex: 0 as const,
    }),
    [open]
  );

  const getOverlayProps = useCallback(
    () => ({
      role: "dialog" as const,
      "aria-modal": true as const,
      onClick: () => close(),
    }),
    [close]
  );

  const getContentProps = useCallback(
    () => ({
      onClick: (e: ReactMouseEvent) => e.stopPropagation(),
    }),
    []
  );

  const getCloseButtonProps = useCallback(
    () => ({
      onClick: () => close(),
      "aria-label": "Close",
      ref: (node: HTMLElement | null) => {
        closeButtonRef.current = node;
      },
    }),
    [close]
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
    getOverlayProps,
    getContentProps,
    getCloseButtonProps,
  };
}
