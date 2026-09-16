export interface ScraperSource {
  id: string;
  name: string;
  baseUrl: string;
  listUrl: string;
  listItemSelector: string;
  typeKey: string;
  scheduleCron: string | null;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ScraperRule {
  id: string;
  sourceId: string;
  name: string;
  titleSelector: string;
  bodySelector: string;
  excerptSelector: string | null;
  coverImageSelector: string | null;
  coverImageAttr: string;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export const CRAWL_JOB_STATUSES = ["PENDING", "RUNNING", "SUCCESS", "FAILED"] as const;
export type CrawlJobStatus = (typeof CRAWL_JOB_STATUSES)[number];

export interface CrawlJob {
  id: string;
  sourceId: string;
  ruleId: string;
  status: CrawlJobStatus;
  itemsFound: number;
  itemsNew: number;
  errorMessage: string | null;
  triggeredBy: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
}

/**
 * RAW is never persisted (ARCHITECTURE.md madde 10 — extraction is
 * synchronous during the crawl) and DUPLICATE never creates a row (the
 * `raw_data_items.contentHash` unique constraint stops it earlier) — so
 * only these four statuses actually appear in the DB.
 */
export const DATA_POOL_STATUSES = ["PROCESSED", "REJECTED", "READY", "PUBLISHED"] as const;
export type DataPoolStatus = (typeof DATA_POOL_STATUSES)[number];

export interface DataPoolItem {
  id: string;
  rawDataItemId: string;
  sourceId: string;
  typeKey: string;
  title: string;
  slug: string | null;
  excerpt: string | null;
  body: string | null;
  coverImage: string | null;
  status: DataPoolStatus;
  contentId: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  sourceUrl: string;
}
