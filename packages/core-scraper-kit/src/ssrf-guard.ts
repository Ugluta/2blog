import { URL } from "node:url";
import dns from "node:dns/promises";

export class SsrfBlockedError extends Error {}

function isPrivateIPv4(address: string): boolean {
  const octets = address.split(".").map(Number);
  if (octets.length !== 4 || octets.some((n) => Number.isNaN(n))) return true; // malformed → treat as unsafe
  const [a, b] = octets;
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 127) return true; // 127.0.0.0/8 loopback
  if (a === 169 && b === 254) return true; // 169.254.0.0/16 link-local
  if (a === 172 && b! >= 16 && b! <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 100 && b! >= 64 && b! <= 127) return true; // 100.64.0.0/10 CGNAT
  if (a === 0) return true; // 0.0.0.0/8
  if (a! >= 224) return true; // multicast/reserved (224.0.0.0/4 and above)
  return false;
}

function isPrivateIPv6(address: string): boolean {
  const normalized = address.toLowerCase();
  if (normalized === "::1") return true; // loopback
  if (normalized.startsWith("fe80:") || normalized.startsWith("fe8") || normalized.startsWith("fe9") || normalized.startsWith("fea") || normalized.startsWith("feb")) return true; // fe80::/10 link-local
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true; // fc00::/7 unique local
  const mapped = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIPv4(mapped[1]!);
  return false;
}

/**
 * Core-level guard (ARCHITECTURE.md madde "SSRF: Scraper/AI URL işleme
 * modüllerinde allowlist + private IP range engeli"). Resolves DNS and
 * checks the *resolved* address, not just the hostname string — a
 * hostname can point to a private IP via DNS rebinding, so checking the
 * URL text alone isn't enough.
 */
export async function assertPublicHttpUrl(rawUrl: string): Promise<void> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new SsrfBlockedError(`Invalid URL: ${rawUrl}`);
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new SsrfBlockedError(`Unsupported protocol for ${rawUrl}: ${url.protocol}`);
  }

  let addresses: { address: string; family: number }[];
  try {
    addresses = await dns.lookup(url.hostname, { all: true });
  } catch {
    throw new SsrfBlockedError(`DNS resolution failed for ${url.hostname}`);
  }

  for (const { address, family } of addresses) {
    const isPrivate = family === 4 ? isPrivateIPv4(address) : isPrivateIPv6(address);
    if (isPrivate) {
      throw new SsrfBlockedError(`Blocked private/internal address for ${url.hostname}: ${address}`);
    }
  }
}
