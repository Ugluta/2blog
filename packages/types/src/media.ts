export type MediaKind = "IMAGE" | "VIDEO" | "AUDIO" | "DOCUMENT";

export interface Media {
  id: string;
  kind: MediaKind;
  url: string;
  originalFilename: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  duration: number | null;
  altText: string | null;
  caption: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}
