import { createHash } from "node:crypto";

export function computeHash(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

/**
 * Display-only — the original filename is untrusted input (master prompt
 * madde 12) and is never used to build a storage key or any filesystem
 * path; the storage key is always `${uuid}.${extensionFromSniffedMime}`.
 */
export function sanitizeDisplayFilename(filename: string): string {
  const base = filename.split(/[/\\]/).pop() ?? "file";
  const cleaned = base.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 200);
  return cleaned.length > 0 ? cleaned : "file";
}
