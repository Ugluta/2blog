import { describe, expect, it } from "vitest";
import { assertPublicHttpUrl, SsrfBlockedError } from "./ssrf-guard";

// Literal IP addresses resolve locally (no real DNS query), so these
// run offline and deterministically — no network access needed.
describe("assertPublicHttpUrl", () => {
  it.each([
    ["http://127.0.0.1/", "IPv4 loopback"],
    ["http://10.0.0.5/", "10.0.0.0/8 private"],
    ["http://172.16.0.1/", "172.16.0.0/12 private"],
    ["http://172.31.255.255/", "172.16.0.0/12 private (upper bound)"],
    ["http://192.168.1.1/", "192.168.0.0/16 private"],
    ["http://169.254.169.254/", "link-local (cloud metadata endpoint)"],
    ["http://100.64.0.1/", "100.64.0.0/10 CGNAT"],
    ["http://0.0.0.0/", "0.0.0.0/8"],
    ["http://224.0.0.1/", "multicast/reserved"],
    ["http://[::1]/", "IPv6 loopback"],
    ["http://[fd00::1]/", "IPv6 unique local (fc00::/7)"],
    ["http://[fe80::1]/", "IPv6 link-local"],
  ])("blocks %s (%s)", async (url) => {
    await expect(assertPublicHttpUrl(url)).rejects.toThrow(SsrfBlockedError);
  });

  it.each([
    ["http://172.15.255.255/", "just below the 172.16.0.0/12 range"],
    ["http://172.32.0.0/", "just above the 172.16.0.0/12 range"],
    ["http://100.63.255.255/", "just below the CGNAT range"],
    ["http://100.128.0.0/", "just above the CGNAT range"],
    ["http://8.8.8.8/", "a real public IP (Google DNS)"],
    ["http://1.1.1.1/", "a real public IP (Cloudflare DNS)"],
  ])("allows %s (%s)", async (url) => {
    await expect(assertPublicHttpUrl(url)).resolves.toBeUndefined();
  });

  it("rejects an unsupported protocol before ever resolving DNS", async () => {
    await expect(assertPublicHttpUrl("ftp://example.com/")).rejects.toThrow(/Unsupported protocol/);
  });

  it("rejects a malformed URL", async () => {
    await expect(assertPublicHttpUrl("not a url")).rejects.toThrow(SsrfBlockedError);
  });

  it("treats a malformed IPv4-looking address as unsafe rather than crashing", async () => {
    // isPrivateIPv4's own "malformed → treat as unsafe" fallback, exercised
    // indirectly since it's not exported: a hostname that parses as a URL
    // but resolves to something dns.lookup itself would reject reaches the
    // DNS-failure branch instead, which is also fail-closed.
    await expect(assertPublicHttpUrl("http://this-domain-should-not-exist.invalid/")).rejects.toThrow(SsrfBlockedError);
  });
});
