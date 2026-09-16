/**
 * Magic-byte sniffing for the fixed allowlist in media-kind.ts. The
 * client-declared Content-Type is never trusted (ARCHITECTURE.md madde 13
 * / master prompt madde 12) — only what the actual bytes say counts. Kept
 * as a hand-rolled check instead of a library because the allowlist is
 * small and fixed, and every "detect file type" npm package that's current
 * ships ESM-only, which fights this package's CommonJS build.
 */
export function sniffMimeType(buffer: Buffer): string | null {
  const isAscii = (offset: number, text: string) => buffer.subarray(offset, offset + text.length).toString("ascii") === text;

  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
    return "image/png";
  if (buffer.length >= 6 && isAscii(0, "GIF8") && (buffer[4] === 0x37 || buffer[4] === 0x39) && buffer[5] === 0x61) return "image/gif";
  if (buffer.length >= 12 && isAscii(0, "RIFF") && isAscii(8, "WEBP")) return "image/webp";
  if (buffer.length >= 12 && isAscii(0, "RIFF") && isAscii(8, "WAVE")) return "audio/wav";
  if (buffer.length >= 8 && isAscii(4, "ftyp")) return "video/mp4";
  if (buffer.length >= 4 && buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3) return "video/webm";
  if (buffer.length >= 4 && isAscii(0, "OggS")) return "audio/ogg";
  if (buffer.length >= 3 && ((buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) || (buffer[0] === 0xff && (buffer[1]! & 0xe0) === 0xe0)))
    return "audio/mpeg";
  if (buffer.length >= 4 && isAscii(0, "%PDF")) return "application/pdf";

  return null;
}
