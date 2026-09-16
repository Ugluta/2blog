/**
 * Content Engine (ARCHITECTURE.md madde 5). Generic across every future app
 * (Blog, Evrak, Koli, ...) — RAW/PROCESSING happen upstream in the Data Pool
 * (scraper/AI phases, not built yet); once something reaches here it starts
 * at DRAFT.
 */
export const CONTENT_STATUSES = [
  "DRAFT",
  "REVIEW",
  "APPROVED",
  "SCHEDULED",
  "PUBLISHED",
  "ARCHIVED",
] as const;

export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string | null;
}

export interface Tag {
  id: string;
  slug: string;
  name: string;
}

export interface Content {
  id: string;
  typeKey: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string | null;
  status: ContentStatus;
  authorId: string;
  coverImage: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
  noindex: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  categories: Category[];
  tags: Tag[];
}
