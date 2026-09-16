import { assertPublicHttpUrl } from "./ssrf-guard";

export const DEFAULT_USER_AGENT = "2blogBot/1.0 (+https://2blog.example/bot)";

export interface FetchHtmlOptions {
  timeoutMs?: number;
  retries?: number;
  userAgent?: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Every scraper HTTP call goes through this — SSRF guard first (madde
 * "allowlist + private IP range engeli"), then a bounded fetch with
 * timeout + exponential-backoff retry. Domain modules never call
 * `fetch()` directly against a scraped URL.
 */
export async function fetchHtml(url: string, options: FetchHtmlOptions = {}): Promise<string> {
  const { timeoutMs = 10_000, retries = 2, userAgent = DEFAULT_USER_AGENT } = options;

  await assertPublicHttpUrl(url);

  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { signal: controller.signal, headers: { "User-Agent": userAgent } });
      if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
      return await res.text();
    } catch (error) {
      lastError = error;
      if (attempt < retries) await sleep(2 ** attempt * 500);
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError instanceof Error ? lastError : new Error(`Failed to fetch ${url}`);
}
