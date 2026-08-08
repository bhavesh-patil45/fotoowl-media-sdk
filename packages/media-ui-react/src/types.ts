/**
 * This package never imports from media-core or media-react. The only
 * requirement it places on consumer data is that each item has a stable
 * `id` — everything else (urls, dimensions, whatever) is opaque to these
 * components. That's what makes them genuinely reusable outside the
 * Pexels/media-core context.
 */
export interface Identifiable {
  id: string;
}
