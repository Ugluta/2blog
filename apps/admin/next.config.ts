import type { NextConfig } from "next";

/**
 * Unlike apps/web's `coverImage` (a free-form URL), `media.url` always
 * comes from our own S3StorageProvider — never an arbitrary/scraped host —
 * so the medya library can safely optimize every image via next/image
 * without the SafeImage host-check apps/web needs.
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
