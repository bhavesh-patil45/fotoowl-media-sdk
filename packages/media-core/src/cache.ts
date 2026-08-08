/**
 * Small in-memory cache with TTL, plus in-flight request de-duplication.
 *
 * De-dupe matters more than the cache itself for a search-as-you-type UI:
 * without it, two components (or a fast re-render) requesting the same
 * page mid-flight would fire two identical network calls.
 */
export class RequestCache {
  private store = new Map<string, { value: unknown; expiresAt: number }>();
  private inFlight = new Map<string, Promise<unknown>>();

  constructor(private ttlMs: number = 5 * 60 * 1000) {}

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value as T;
  }

  set<T>(key: string, value: T): void {
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  /**
   * Wraps a request: serves from cache if fresh, joins an in-flight
   * request for the same key if one exists, otherwise calls `fetcher`
   * and caches the result.
   */
  async dedupe<T>(key: string, fetcher: () => Promise<T>, opts: { skipCache?: boolean } = {}): Promise<{ value: T; cached: boolean }> {
    if (!opts.skipCache) {
      const cached = this.get<T>(key);
      if (cached !== undefined) return { value: cached, cached: true };
    }

    const pending = this.inFlight.get(key) as Promise<T> | undefined;
    if (pending) {
      return { value: await pending, cached: false };
    }

    const promise = fetcher()
      .then((value) => {
        this.set(key, value);
        return value;
      })
      .finally(() => {
        this.inFlight.delete(key);
      });

    this.inFlight.set(key, promise);
    return { value: await promise, cached: false };
  }

  clear(): void {
    this.store.clear();
  }
}
