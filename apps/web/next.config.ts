import type { NextConfig } from "next";

/**
 * Only the deployment's own storage host is optimized via next/image —
 * `contents.coverImage` is a free-form URL (admin can paste any link, or
 * a scraped item can suggest one), so it can point anywhere. Opening
 * next/image's remote-fetch-and-resize optimizer to an arbitrary
 * attacker-influenced host would be the same class of risk the scraper's
 * SSRF guard exists to prevent (ARCHITECTURE.md's private-IP-range
 * allowlist principle) — so images from other hosts render as a plain
 * `<img>` instead (see components/SafeImage.tsx), unoptimized but safe.
 */
const storagePort = process.env.STORAGE_PORT;
const storageProtocol = process.env.STORAGE_USE_SSL === "true" ? "https" : "http";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  images: {
    remotePatterns: process.env.STORAGE_ENDPOINT
      ? [
          {
            protocol: storageProtocol,
            hostname: process.env.STORAGE_ENDPOINT,
            port: storagePort,
          },
        ]
      : [],
  },
};

export default nextConfig;
