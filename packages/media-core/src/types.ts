/**
 * Public, provider-agnostic types.
 *
 * IMPORTANT: nothing outside this file (or provider adapters) should ever
 * see a raw Pexels response shape. Wrappers, components, and the app only
 * ever deal with these normalized types, so swapping providers later
 * (Unsplash, a different API, a CLI-only data source) never leaks upward.
 */

export type MediaKind = "photo" | "video";

export interface MediaAuthor {
  id: string | number;
  name: string;
  profileUrl?: string;
}

export interface MediaPhoto {
  kind: "photo";
  id: string;
  width: number;
  height: number;
  averageColor?: string;
  alt?: string;
  author: MediaAuthor;
  sourceUrl: string; // link back to the original on the provider's site
  urls: {
    thumbnail: string;
    small: string;
    medium: string;
    large: string;
    original: string;
  };
}

export interface MediaVideoFile {
  quality: "sd" | "hd" | "uhd" | string;
  width: number;
  height: number;
  url: string;
}

export interface MediaVideo {
  kind: "video";
  id: string;
  width: number;
  height: number;
  durationSeconds: number;
  author: MediaAuthor;
  sourceUrl: string;
  thumbnailUrl: string;
  files: MediaVideoFile[];
}

export type MediaItem = MediaPhoto | MediaVideo;

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  perPage: number;
  totalResults?: number;
  hasNextPage: boolean;
  nextPage?: number;
}

export interface SearchOptions {
  page?: number;
  perPage?: number;
  /** AbortSignal for cancelling in-flight requests (e.g. on unmount / new keystroke) */
  signal?: AbortSignal;
  /** bypass in-memory cache for this call */
  skipCache?: boolean;
}

export class MediaSDKError extends Error {
  readonly status?: number;
  readonly code: string;

  constructor(message: string, opts: { status?: number; code?: string } = {}) {
    super(message);
    this.name = "MediaSDKError";
    this.status = opts.status;
    this.code = opts.code ?? "UNKNOWN";
  }
}
