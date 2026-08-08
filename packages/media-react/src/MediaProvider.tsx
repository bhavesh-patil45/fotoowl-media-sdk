import React, { createContext, useContext, useMemo, useRef } from "react";
import { createMediaClient, type MediaClient, type MediaClientConfig } from "media-core";

const MediaClientContext = createContext<MediaClient | null>(null);

export interface MediaProviderProps {
  /** everything media-core's createMediaClient needs, incl. the Pexels API key */
  config: MediaClientConfig;
  children: React.ReactNode;
}

/**
 * Owns the single `media-core` client instance for the subtree. This is the
 * ONLY place in the React layer that calls `createMediaClient` / touches
 * the API key — every hook below just reads the client off context.
 *
 * The client is created once (ref, not state) so it survives re-renders;
 * if `config` identity changes we intentionally do NOT recreate it, since
 * an API key/base URL is expected to be static for the app's lifetime.
 * (If truly dynamic re-auth is ever needed, add an explicit
 * `client.reconfigure()` to media-core rather than silently recreating
 * the client here — that keeps the "no business logic in the wrapper"
 * rule intact.)
 */
export function MediaProvider({ config, children }: MediaProviderProps) {
  const clientRef = useRef<MediaClient | null>(null);
  if (!clientRef.current) {
    clientRef.current = createMediaClient(config);
  }

  const value = useMemo(() => clientRef.current!, []);

  return <MediaClientContext.Provider value={value}>{children}</MediaClientContext.Provider>;
}

/** Escape hatch for advanced use (manual event subscriptions, cache clearing, etc). */
export function useMediaClient(): MediaClient {
  const client = useContext(MediaClientContext);
  if (!client) {
    throw new Error("useMediaClient must be used within a <MediaProvider>");
  }
  return client;
}
