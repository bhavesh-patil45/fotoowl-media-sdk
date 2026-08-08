import { useEffect } from "react";
import type { MediaPhoto } from "media-react";
import { useMediaClient } from "media-react";
import { useLightbox } from "media-ui-react";

export interface PhotoLightboxProps {
  photos: MediaPhoto[];
  openIndex: number | null;
  onClose: () => void;
}

/** Wires media-ui-react's headless useLightbox to actual markup + media-core event tracking. */
export function PhotoLightbox({ photos, openIndex, onClose }: PhotoLightboxProps) {
  const client = useMediaClient();
  const lightbox = useLightbox<MediaPhoto>({
    items: photos,
    onNavigate: (item) => client.trackView(item, "lightbox"),
  });

  // openIndex is controlled by the parent grid; sync it into the hook's own state.
  useEffect(() => {
    if (openIndex !== null && photos[openIndex]) {
      lightbox.open(photos[openIndex]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openIndex]);

  if (!lightbox.isOpen || !lightbox.activeItem) return null;
  const item = lightbox.activeItem;

  return (
    <div {...lightbox.getOverlayProps()} className="lightbox-overlay" onClick={() => { lightbox.close(); onClose(); }}>
      <div {...lightbox.getContentProps()} className="lightbox-content">
        <button {...lightbox.getCloseButtonProps()} className="lightbox-close" onClick={() => { lightbox.close(); onClose(); }}>
          ✕
        </button>

        {lightbox.hasPrev && (
          <button className="lightbox-nav lightbox-nav--prev" onClick={lightbox.prev} aria-label="Previous">
            ‹
          </button>
        )}

        <img
          src={item.urls.large}
          alt={item.alt || `Photo by ${item.author.name}`}
          className="lightbox-image"
          onLoad={() => client.trackDownload(item, "lightbox")}
        />

        <figcaption className="lightbox-caption">
          Photo by {item.author.name} ·{" "}
          <a href={item.sourceUrl} target="_blank" rel="noreferrer">
            View on Pexels
          </a>
        </figcaption>

        {lightbox.hasNext && (
          <button className="lightbox-nav lightbox-nav--next" onClick={lightbox.next} aria-label="Next">
            ›
          </button>
        )}
      </div>
    </div>
  );
}
