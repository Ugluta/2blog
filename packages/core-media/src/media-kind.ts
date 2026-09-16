export type MediaKind = "IMAGE" | "VIDEO" | "AUDIO" | "DOCUMENT";

/**
 * The allowlist and the extension used for the storage key are derived from
 * this single map so they can never drift apart. SVG is deliberately
 * excluded from images — it can embed scripts and is an XSS vector when
 * served/viewed inline (OWASP file-upload guidance).
 */
const MIME_TO_KIND: Record<string, MediaKind> = {
  "image/jpeg": "IMAGE",
  "image/png": "IMAGE",
  "image/gif": "IMAGE",
  "image/webp": "IMAGE",
  "video/mp4": "VIDEO",
  "video/webm": "VIDEO",
  "audio/mpeg": "AUDIO",
  "audio/wav": "AUDIO",
  "audio/ogg": "AUDIO",
  "application/pdf": "DOCUMENT",
};

const MIME_TO_EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
  "audio/ogg": "ogg",
  "application/pdf": "pdf",
};

export const ALLOWED_MIME_TYPES = Object.keys(MIME_TO_KIND);

export function isAllowedMimeType(mime: string): boolean {
  return mime in MIME_TO_KIND;
}

export function mimeToKind(mime: string): MediaKind {
  const kind = MIME_TO_KIND[mime];
  if (!kind) throw new Error(`Unsupported mime type: ${mime}`);
  return kind;
}

export function mimeToExtension(mime: string): string {
  const ext = MIME_TO_EXTENSION[mime];
  if (!ext) throw new Error(`Unsupported mime type: ${mime}`);
  return ext;
}
