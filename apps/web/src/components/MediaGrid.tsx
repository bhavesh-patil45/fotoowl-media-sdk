import type { MediaPhoto, MediaVideo } from "media-react";
import { useMediaClient } from "media-react";
import { useGrid } from "media-ui-react";

type GridItem = MediaPhoto | MediaVideo;

export interface MediaGridProps {
  items: GridItem[];
  loading: boolean;
  isInitialLoading: boolean;
  error: Error | null;
  hasNextPage: boolean;
  onLoadMore: () => void;
  onSelect: (item: GridItem, index: number) => void;
}

/**
 * This component is the one place that imports BOTH media-react
 * (useMediaClient, for firing the `view`/`download` tracking events) and
 * media-ui-react (useGrid, for the headless infinite-scroll wiring) — that
 * split lives at the app layer by design, per the assignment's dependency
 * rules. media-ui-react itself never sees media-core or media-react.
 */
export function MediaGrid({ items, loading, isInitialLoading, error, hasNextPage, onLoadMore, onSelect }: MediaGridProps) {
  const client = useMediaClient();
  const { getContainerProps, getItemProps, sentinelRef } = useGrid<GridItem>({
    hasNextPage,
    loading,
    onLoadMore,
  });

  if (isInitialLoading) return <p className="status-text">Loading…</p>;
  if (error) return <p className="status-text status-text--error">Couldn't load media: {error.message}</p>;
  if (!items.length) return <p className="status-text">No results.</p>;

  return (
    <>
      <div {...getContainerProps()} className="grid">
        {items.map((item, index) => {
          const thumb = item.kind === "photo" ? item.urls.thumbnail : item.thumbnailUrl;
          const itemProps = getItemProps(item);
          return (
            <button
              key={itemProps.key}
              type="button"
              className="grid-cell"
              data-item-id={itemProps["data-item-id"]}
              tabIndex={itemProps.tabIndex}
              onClick={() => {
                client.trackView(item, "grid");
                onSelect(item, index);
              }}
              aria-label={item.kind === "photo" ? item.alt || `Photo by ${item.author.name}` : `Video by ${item.author.name}`}
            >
              <img src={thumb} alt="" loading="lazy" />
              {item.kind === "video" && <span className="grid-cell__badge">▶ video</span>}
            </button>
          );
        })}
      </div>
      {hasNextPage && (
        <div ref={sentinelRef} className="grid-sentinel">
          {loading && <span className="status-text">Loading more…</span>}
        </div>
      )}
    </>
  );
}
