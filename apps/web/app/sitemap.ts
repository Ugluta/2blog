import type { MetadataRoute } from "next";
import type { CursorPage } from "@2blog/types";
import { getPosts, getProjects, getServices, getWorks } from "../lib/api";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
/** Guards against an infinite loop if the API ever misbehaves — a real site won't hit this. */
const MAX_PAGES = 50;

/**
 * Without this, Next.js prerenders sitemap.xml once at `next build` time
 * and never again — new content published after deploy would never
 * appear until the next redeploy. In practice the effective window ends
 * up governed by lib/api.ts's own per-fetch `revalidate: 60`, since
 * Next.js takes the minimum of the two — this just sets the ceiling.
 */
export const revalidate = 3600;

interface Sluggable {
  slug: string;
  updatedAt: string;
  noindex: boolean;
}

async function collectAll<T extends Sluggable>(fetchPage: (cursor?: string) => Promise<CursorPage<T>>): Promise<T[]> {
  const items: T[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < MAX_PAGES; page++) {
    const result = await fetchPage(cursor);
    items.push(...result.items);
    if (!result.nextCursor) break;
    cursor = result.nextCursor;
  }
  return items;
}

/**
 * Next.js's `app/sitemap.ts` convention — auto-served at `/sitemap.xml`.
 * Paginates through every published item rather than capping at one API
 * page, so the sitemap stays complete as content grows.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, projects, services, works] = await Promise.all([
    collectAll((cursor) => getPosts(cursor, 100)),
    collectAll((cursor) => getProjects(cursor, 100)),
    collectAll((cursor) => getServices(cursor, 100)),
    collectAll((cursor) => getWorks(cursor, 100)),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/blog`, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/hizmetler`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/projelerimiz`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/yaptiklarimiz`, changeFrequency: "weekly", priority: 0.8 },
  ];

  const toEntry = (basePath: string) => (item: Sluggable): MetadataRoute.Sitemap[number] => ({
    url: `${SITE_URL}${basePath}/${item.slug}`,
    lastModified: item.updatedAt,
    changeFrequency: "monthly",
    priority: 0.6,
  });

  const dynamicRoutes: MetadataRoute.Sitemap = [
    ...posts.filter((item) => !item.noindex).map(toEntry("/blog")),
    ...projects.filter((item) => !item.noindex).map(toEntry("/projelerimiz")),
    ...services.filter((item) => !item.noindex).map(toEntry("/hizmetler")),
    ...works.filter((item) => !item.noindex).map(toEntry("/yaptiklarimiz")),
  ];

  return [...staticRoutes, ...dynamicRoutes];
}
