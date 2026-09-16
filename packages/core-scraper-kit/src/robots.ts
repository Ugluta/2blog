import { fetchHtml } from "./http-fetcher";

interface RobotsRule {
  path: string;
  allow: boolean;
}

/**
 * Minimal robots.txt parser — only what the crawl loop needs (Disallow/Allow
 * prefix matching under a `User-agent: *` or our own UA group), not the
 * full spec (no wildcard/`$` support). Hand-rolled rather than a dependency
 * for the same reason as Media's magic-byte MIME sniffing: this is a small,
 * fully-owned piece of parsing logic, not worth an extra package for.
 */
function parseRobotsTxt(text: string, userAgent: string): RobotsRule[] {
  const lines = text.split("\n").map((line) => line.split("#")[0]!.trim());
  const rules: RobotsRule[] = [];
  let inRelevantGroup = false;

  for (const line of lines) {
    const [rawKey, ...rest] = line.split(":");
    if (!rawKey || rest.length === 0) continue;
    const key = rawKey.trim().toLowerCase();
    const value = rest.join(":").trim();

    if (key === "user-agent") {
      const isWildcard = value === "*";
      const isOurs = value.length > 0 && userAgent.toLowerCase().includes(value.toLowerCase());
      inRelevantGroup = isWildcard || isOurs;
      continue;
    }

    if (!inRelevantGroup) continue;

    if (key === "disallow" && value) {
      rules.push({ path: value, allow: false });
    } else if (key === "allow" && value) {
      rules.push({ path: value, allow: true });
    }
  }

  return rules;
}

const robotsCache = new Map<string, { rules: RobotsRule[]; fetchedAt: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000;

/**
 * Fails open: if robots.txt is missing or unreachable, the path is
 * allowed (standard crawler convention — absence of a robots.txt is not a
 * disallow). Longest-matching-rule-wins, the standard robots.txt
 * precedence rule.
 */
export async function isAllowedByRobots(targetUrl: string, userAgent: string): Promise<boolean> {
  const url = new URL(targetUrl);
  const origin = url.origin;

  let cached = robotsCache.get(origin);
  if (!cached || Date.now() - cached.fetchedAt > CACHE_TTL_MS) {
    let rules: RobotsRule[] = [];
    try {
      const text = await fetchHtml(`${origin}/robots.txt`, { retries: 0, timeoutMs: 5000, userAgent });
      rules = parseRobotsTxt(text, userAgent);
    } catch {
      rules = [];
    }
    cached = { rules, fetchedAt: Date.now() };
    robotsCache.set(origin, cached);
  }

  const path = url.pathname + url.search;
  let bestMatch: RobotsRule | null = null;
  for (const rule of cached.rules) {
    if (path.startsWith(rule.path) && (!bestMatch || rule.path.length > bestMatch.path.length)) {
      bestMatch = rule;
    }
  }

  return bestMatch ? bestMatch.allow : true;
}
