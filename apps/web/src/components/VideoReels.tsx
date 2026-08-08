import { useEffect, useRef } from "react";
import type { MediaVideo } from "media-react";
import { useMediaClient } from "media-react";
import { useReelSwiper } from "media-ui-react";

export interface VideoReelsProps {
  videos: MediaVideo[];
  onClose: () => void;
}

function bestFile(video: MediaVideo) {
  // prefer hd, fall back to whatever's first
  return video.files.find((f) => f.quality === "hd") ?? video.files[0];
}

export function VideoReels({ videos, onClose }: VideoReelsProps) {
  const client = useMediaClient();
  const videoElsRef = useRef<Map<string, HTMLVideoElement>>(new Map());

  const { getContainerProps, getItemProps, activeItem } = useReelSwiper<MediaVideo>({
    items: videos,
    onActiveChange: (item) => client.trackView(item, "reel"),
  });

  // play the active reel, pause the rest
  useEffect(() => {
    videoElsRef.current.forEach((el, id) => {
      if (activeItem && id === activeItem.id) {
        el.play().catch(() => {});
      } else {
        el.pause();
      }
    });
  }, [activeItem]);

  const containerProps = getContainerProps();

  return (
    <div className="reels-overlay">
      <button className="lightbox-close" onClick={onClose} aria-label="Close reels">
        ✕
      </button>
      <div {...containerProps} className="reels-container">
        {videos.map((video, index) => {
          const itemProps = getItemProps(video, index);
          const file = bestFile(video);
          return (
            <div key={itemProps.key} style={itemProps.style} ref={itemProps.ref} className="reel-item">
              {file && (
                <video
                  ref={(el) => {
                    if (el) videoElsRef.current.set(video.id, el);
                    else videoElsRef.current.delete(video.id);
                  }}
                  src={file.url}
                  poster={video.thumbnailUrl}
                  loop
                  muted
                  playsInline
                  className="reel-item__video"
                  onPlay={() => client.trackDownload(video, "reel")}
                />
              )}
              <div className="reel-item__caption">by {video.author.name}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
