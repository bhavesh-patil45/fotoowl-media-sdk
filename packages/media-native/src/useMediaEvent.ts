import { useEffect, useRef } from "react";
import type { MediaSDKEventMap, MediaSDKEventName } from "media-core";
import { useMediaClient } from "./MediaProvider.js";

/**
 * Subscribes to a media-core event for the lifetime of the component.
 * Thin adapter over `client.on(event, handler)` — the emitter itself
 * (dedupe, error isolation, etc.) lives entirely in media-core.
 */
export function useMediaEvent<E extends MediaSDKEventName>(event: E, handler: (payload: MediaSDKEventMap[E]) => void): void {
  const client = useMediaClient();
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const unsubscribe = client.on(event, (payload) => handlerRef.current(payload));
    return unsubscribe;
  }, [client, event]);
}
