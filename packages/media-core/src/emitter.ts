import type { MediaItem } from "./types.js";

/**
 * Events the SDK emits for activity tracking. Kept deliberately small and
 * closed (not an arbitrary string bus) so consumers get autocomplete and
 * type-checked payloads instead of guessing event names.
 */
export interface MediaSDKEventMap {
  /** fired when a consumer requests/opens the full-resolution asset */
  download: { item: MediaItem; source: "grid" | "lightbox" | "reel" | "unknown" };
  /** fired when an item is considered "viewed" (e.g. opened in lightbox, or a reel becomes active) */
  view: { item: MediaItem; source: "grid" | "lightbox" | "reel" | "unknown" };
  /** fired on every request the client makes, useful for debugging/telemetry */
  request: { endpoint: string; cached: boolean };
  /** fired when a request fails */
  error: { endpoint: string; error: unknown };
}

export type MediaSDKEventName = keyof MediaSDKEventMap;
type Listener<E extends MediaSDKEventName> = (payload: MediaSDKEventMap[E]) => void;

/**
 * Minimal typed pub/sub. No external dependency — this is intentionally
 * small so it stays trivially portable (works identically in a browser,
 * React Native, or a Node CLI script).
 */
export class MediaEventEmitter {
  private listeners: { [K in MediaSDKEventName]?: Set<Listener<K>> } = {};

  on<E extends MediaSDKEventName>(event: E, listener: Listener<E>): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = new Set() as (typeof this.listeners)[E];
    }
    const set = this.listeners[event] as Set<Listener<E>>;
    set.add(listener);
    // returning the unsubscribe fn directly is convenient for `useEffect` cleanup
    return () => this.off(event, listener);
  }

  off<E extends MediaSDKEventName>(event: E, listener: Listener<E>): void {
    (this.listeners[event] as Set<Listener<E>> | undefined)?.delete(listener);
  }

  emit<E extends MediaSDKEventName>(event: E, payload: MediaSDKEventMap[E]): void {
    (this.listeners[event] as Set<Listener<E>> | undefined)?.forEach((fn) => {
      try {
        fn(payload);
      } catch (err) {
        // a subscriber throwing should never break the SDK's own control flow
        console.error(`[media-core] listener for "${event}" threw:`, err);
      }
    });
  }

  removeAllListeners(event?: MediaSDKEventName): void {
    if (event) {
      delete this.listeners[event];
    } else {
      this.listeners = {};
    }
  }
}
