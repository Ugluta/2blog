import { createHash } from "node:crypto";

export function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/**
 * Dedup key for `raw_data_items.contentHash` — sha256 of the normalized,
 * lowercased text so trivial formatting differences (extra whitespace,
 * a re-fetch of the same page) don't produce a "new" item.
 */
export function computeContentHash(input: string): string {
  return createHash("sha256").update(normalizeWhitespace(input).toLowerCase()).digest("hex");
}
