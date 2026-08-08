import type { MediaPhoto, MediaVideo } from "../types.js";

/**
 * Raw Pexels API shapes (subset of fields we actually use).
 * These types are intentionally NOT exported from the package's public
 * entrypoint — they're an implementation detail of this one adapter file.
 * If a second provider (e.g. Unsplash) were added later, it would get its
 * own adapter file with its own raw types, and both would normalize into
 * the same MediaPhoto / MediaVideo shape.
 */
interface PexelsPhotoRaw {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_id: number;
  photographer_url: string;
  avg_color: string;
  alt: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    tiny: string;
  };
}

interface PexelsVideoRaw {
  id: number;
  width: number;
  height: number;
  duration: number;
  url: string;
  image: string;
  user: { id: number; name: string; url: string };
  video_files: Array<{
    id: number;
    quality: string; // "sd" | "hd" | "uhd"
    width: number;
    height: number;
    link: string;
  }>;
}

export interface PexelsPhotosResponse {
  page: number;
  per_page: number;
  total_results: number;
  next_page?: string;
  photos: PexelsPhotoRaw[];
}

export interface PexelsVideosResponse {
  page: number;
  per_page: number;
  total_results: number;
  next_page?: string;
  videos: PexelsVideoRaw[];
}

export function normalizePhoto(raw: PexelsPhotoRaw): MediaPhoto {
  return {
    kind: "photo",
    id: String(raw.id),
    width: raw.width,
    height: raw.height,
    averageColor: raw.avg_color,
    alt: raw.alt || undefined,
    author: {
      id: raw.photographer_id,
      name: raw.photographer,
      profileUrl: raw.photographer_url,
    },
    sourceUrl: raw.url,
    urls: {
      thumbnail: raw.src.tiny,
      small: raw.src.small,
      medium: raw.src.medium,
      large: raw.src.large,
      original: raw.src.original,
    },
  };
}

export function normalizeVideo(raw: PexelsVideoRaw): MediaVideo {
  return {
    kind: "video",
    id: String(raw.id),
    width: raw.width,
    height: raw.height,
    durationSeconds: raw.duration,
    author: {
      id: raw.user.id,
      name: raw.user.name,
      profileUrl: raw.user.url,
    },
    sourceUrl: raw.url,
    thumbnailUrl: raw.image,
    files: raw.video_files.map((f) => ({
      quality: f.quality,
      width: f.width,
      height: f.height,
      url: f.link,
    })),
  };
}
