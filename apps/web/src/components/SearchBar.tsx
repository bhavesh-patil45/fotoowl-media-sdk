export interface SearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  kind: "photo" | "video";
  onKindChange: (kind: "photo" | "video") => void;
}

export function SearchBar({ query, onQueryChange, kind, onKindChange }: SearchBarProps) {
  return (
    <div className="search-bar">
      <input
        type="search"
        placeholder="Search photos and videos..."
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        className="search-bar__input"
      />
      <div className="search-bar__toggle" role="radiogroup" aria-label="Media type">
        <button
          type="button"
          role="radio"
          aria-checked={kind === "photo"}
          className={kind === "photo" ? "toggle-btn toggle-btn--active" : "toggle-btn"}
          onClick={() => onKindChange("photo")}
        >
          Photos
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={kind === "video"}
          className={kind === "video" ? "toggle-btn toggle-btn--active" : "toggle-btn"}
          onClick={() => onKindChange("video")}
        >
          Videos
        </button>
      </div>
    </div>
  );
}
