export { MediaProvider, useMediaClient } from "./MediaProvider.js";
export type { MediaProviderProps } from "./MediaProvider.js";
export { useMediaSearch } from "./useMediaSearch.js";
export type { UseMediaSearchOptions, UseMediaSearchResult, MediaSearchKind } from "./useMediaSearch.js";
export { useMediaFeed } from "./useMediaFeed.js";
export type { UseMediaFeedResult, UseMediaFeedKind } from "./useMediaFeed.js";
export { useMediaEvent } from "./useMediaEvent.js";

// Re-export the types consumers need without forcing them to also
// depend on media-core directly for basic usage.
export type { MediaItem, MediaPhoto, MediaVideo, MediaClient, MediaClientConfig } from "media-core";
