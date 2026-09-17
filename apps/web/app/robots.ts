import type { MetadataRoute } from "next";
import { getSeoSettings } from "../lib/api";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** Same staleness reasoning as sitemap.ts — this is admin-toggleable, not build-time-fixed. */
export const revalidate = 3600;

/**
 * Next.js's `app/robots.ts` convention — auto-served at `/robots.txt`.
 * Site-wide indexability is admin-controlled (Ayarlar → SEO →
 * "Arama motorları taransın"); per-page `noindex` (already handled via
 * each page's `generateMetadata`) is separate and finer-grained.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const seo = await getSeoSettings();

  return {
    rules: {
      userAgent: "*",
      allow: seo.robotsIndexable ? "/" : undefined,
      disallow: seo.robotsIndexable ? undefined : "/",
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
