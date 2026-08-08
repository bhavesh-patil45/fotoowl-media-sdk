import { useState } from "react";
import { useMediaSearch, useMediaFeed } from "media-react";
import type { MediaPhoto, MediaVideo } from "media-react";
import { SearchBar } from "./components/SearchBar.js";
import { MediaGrid } from "./components/MediaGrid.js";
import { PhotoLightbox } from "./components/PhotoLightbox.js";
import { VideoReels } from "./components/VideoReels.js";

export default function App() {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<"photo" | "video">("photo");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [reelsOpen, setReelsOpen] = useState(false);

  const isSearching = query.trim().length > 0;

  // useMediaSearch and useMediaFeed intentionally share the same result
  // shape (items/loading/isInitialLoading/error/hasNextPage/loadMore), so
  // MediaGrid doesn't need to know or care which mode it's rendering.
  const search = useMediaSearch<MediaPhoto | MediaVideo>(query, { kind, enabled: isSearching });
  const feed = useMediaFeed<MediaPhoto | MediaVideo>(kind);
  const active = isSearching ? search : feed;

  const photos = kind === "photo" ? (active.items as MediaPhoto[]) : [];
  const videos = kind === "video" ? (active.items as MediaVideo[]) : [];

  return (
    <div className="app">
      <header className="app-header">
        <h1>Media SDK Demo</h1>
        <p className="app-subtitle">
          {isSearching ? `Search results for "${query}"` : kind === "photo" ? "Curated photos" : "Popular videos"}
        </p>
        <SearchBar query={query} onQueryChange={setQuery} kind={kind} onKindChange={setKind} />
      </header>

      <main>
        <MediaGrid
          items={active.items}
          loading={active.loading}
          isInitialLoading={active.isInitialLoading}
          error={active.error}
          hasNextPage={active.hasNextPage}
          onLoadMore={active.loadMore}
          onSelect={(_item, index) => {
            if (kind === "photo") setLightboxIndex(index);
            else setReelsOpen(true);
          }}
        />
      </main>

      {kind === "photo" && <PhotoLightbox photos={photos} openIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />}
      {kind === "video" && reelsOpen && <VideoReels videos={videos} onClose={() => setReelsOpen(false)} />}
    </div>
  );
}
