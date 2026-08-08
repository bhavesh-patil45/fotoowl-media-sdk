import { MediaEventEmitter } from "./emitter.js";
import { RequestCache } from "./cache.js";
import { MediaSDKError, type MediaItem, type MediaPhoto, type MediaVideo, type PaginatedResult, type SearchOptions } from "./types.js";
import { normalizePhoto, normalizeVideo, type PexelsPhotosResponse, type PexelsVideosResponse } from "./providers/pexels.js";

const PEXELS_BASE_URL = "https://api.pexels.com/v1";
const PEXELS_VIDEO_BASE_URL = "https://api.pexels.com/videos";

export interface MediaClientConfig {
  /**
   * Pexels API key. The SDK centralizes API-key configuration and keeps authentication
   * concerns inside the core client. Since this assignment is client-side and explicitly
   * requires no backend, the key cannot be treated as a true server-side secret. However,
   * it is never attached to emitted events or exposed beyond the provider setup.
   */
  apiKey: string;
  /** override for tests / mocking */
  baseUrl?: string;
  videoBaseUrl?: string;
  /** cache TTL in ms, default 5 minutes */
  cacheTtlMs?: number;
  /** attach a default console listener for `download`/`view` events. Default: true */
  enableDefaultLogger?: boolean;
}

export interface MediaClient {
  searchPhotos(query: string, options?: SearchOptions): Promise<PaginatedResult<MediaPhoto>>;
  searchVideos(query: string, options?: SearchOptions): Promise<PaginatedResult<MediaVideo>>;
  curatedPhotos(options?: SearchOptions): Promise<PaginatedResult<MediaPhoto>>;
  popularVideos(options?: SearchOptions): Promise<PaginatedResult<MediaVideo>>;
  getPhoto(id: string): Promise<MediaPhoto>;
  getVideo(id: string): Promise<MediaVideo>;

  /** track that a consumer opened/downloaded the full asset for `item` */
  trackDownload(item: MediaItem, source?: "grid" | "lightbox" | "reel" | "unknown"): void;
  /** track that `item` was viewed */
  trackView(item: MediaItem, source?: "grid" | "lightbox" | "reel" | "unknown"): void;

  on: MediaEventEmitter["on"];
  off: MediaEventEmitter["off"];

  clearCache(): void;
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) usp.set(k, String(v));
  }
  return usp.toString();
}

/**
 * Creates a MediaClient. This is the ONE entrypoint that requires the API
 * key — everything downstream (wrappers, hooks, components) works with the
 * returned client instance and never sees the key again.
 */
export function createMediaClient(config: MediaClientConfig): MediaClient {
  const { apiKey } = config;
  if (!apiKey) {
    throw new MediaSDKError("createMediaClient: apiKey is required", { code: "MISSING_API_KEY" });
  }

  const baseUrl = config.baseUrl ?? PEXELS_BASE_URL;
  const videoBaseUrl = config.videoBaseUrl ?? PEXELS_VIDEO_BASE_URL;
  const cache = new RequestCache(config.cacheTtlMs);
  const emitter = new MediaEventEmitter();
  const enableDefaultLogger = config.enableDefaultLogger ?? true;

  if (enableDefaultLogger) {
    emitter.on("download", (p) => console.log(`[media-core] download: ${p.item.kind} ${p.item.id} (${p.source})`));
    emitter.on("view", (p) => console.log(`[media-core] view: ${p.item.kind} ${p.item.id} (${p.source})`));
  }

  async function request<T>(url: string, cacheKey: string, opts: { skipCache?: boolean; signal?: AbortSignal } = {}): Promise<T> {
    const { value, cached } = await cache.dedupe<T>(
      cacheKey,
      async () => {
        let res: Response;
        try {
          // Note: if two callers race on the same cache key, the in-flight
          // fetch uses whichever caller's signal arrived first (see
          // RequestCache.dedupe) — a later caller aborting doesn't cancel
          // a network call another caller is still waiting on.
          res = await fetch(url, { headers: { Authorization: apiKey }, signal: opts.signal });
        } catch (err) {
          emitter.emit("error", { endpoint: url, error: err });
          throw new MediaSDKError("Network request failed", { code: "NETWORK_ERROR" });
        }

        if (!res.ok) {
          const err = new MediaSDKError(`Pexels API error: ${res.status} ${res.statusText}`, {
            status: res.status,
            code: res.status === 401 ? "UNAUTHORIZED" : res.status === 429 ? "RATE_LIMITED" : "API_ERROR",
          });
          emitter.emit("error", { endpoint: url, error: err });
          throw err;
        }

        return (await res.json()) as T;
      },
      { skipCache: opts.skipCache }
    );

    emitter.emit("request", { endpoint: url, cached });
    return value;
  }

  function toPaginated<TRaw, T>(
    raw: { page: number; per_page: number; total_results: number; next_page?: string },
    rawItems: TRaw[],
    normalize: (r: TRaw) => T
  ): PaginatedResult<T> {
    return {
      items: rawItems.map(normalize),
      page: raw.page,
      perPage: raw.per_page,
      totalResults: raw.total_results,
      hasNextPage: Boolean(raw.next_page),
      nextPage: raw.next_page ? raw.page + 1 : undefined,
    };
  }

  return {
    async searchPhotos(query, options = {}) {
      const qs = buildQuery({ query, page: options.page ?? 1, per_page: options.perPage ?? 20 });
      const url = `${baseUrl}/search?${qs}`;
      const raw = await request<PexelsPhotosResponse>(url, url, { skipCache: options.skipCache, signal: options.signal });
      return toPaginated(raw, raw.photos, normalizePhoto);
    },

    async curatedPhotos(options = {}) {
      const qs = buildQuery({ page: options.page ?? 1, per_page: options.perPage ?? 20 });
      const url = `${baseUrl}/curated?${qs}`;
      const raw = await request<PexelsPhotosResponse>(url, url, { skipCache: options.skipCache, signal: options.signal });
      return toPaginated(raw, raw.photos, normalizePhoto);
    },

    async searchVideos(query, options = {}) {
      const qs = buildQuery({ query, page: options.page ?? 1, per_page: options.perPage ?? 20 });
      const url = `${videoBaseUrl}/search?${qs}`;
      const raw = await request<PexelsVideosResponse>(url, url, { skipCache: options.skipCache, signal: options.signal });
      return toPaginated(raw, raw.videos, normalizeVideo);
    },

    async popularVideos(options = {}) {
      const qs = buildQuery({ page: options.page ?? 1, per_page: options.perPage ?? 20 });
      const url = `${videoBaseUrl}/popular?${qs}`;
      const raw = await request<PexelsVideosResponse>(url, url, { skipCache: options.skipCache, signal: options.signal });
      return toPaginated(raw, raw.videos, normalizeVideo);
    },

    async getPhoto(id) {
      const url = `${baseUrl}/photos/${id}`;
      const raw = await request<Parameters<typeof normalizePhoto>[0]>(url, url);
      return normalizePhoto(raw);
    },

    async getVideo(id) {
      const url = `${videoBaseUrl}/videos/${id}`;
      const raw = await request<Parameters<typeof normalizeVideo>[0]>(url, url);
      return normalizeVideo(raw);
    },

    trackDownload(item, source = "unknown") {
      emitter.emit("download", { item, source });
    },

    trackView(item, source = "unknown") {
      emitter.emit("view", { item, source });
    },

    on: emitter.on.bind(emitter),
    off: emitter.off.bind(emitter),

    clearCache() {
      cache.clear();
    },
  };
}
