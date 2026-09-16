export const SCRAPER_QUEUE_NAME = "scraper";

/** BullMQ job payload — the domain module enqueues this, the worker processes it. */
export interface ScraperCrawlJobData {
  crawlJobId: string;
  sourceId: string;
  ruleId: string;
}
