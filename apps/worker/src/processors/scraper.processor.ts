import { Worker, type Job } from "bullmq";
import IORedis from "ioredis";
import { eq } from "drizzle-orm";
import { schema, type Database } from "@2blog/core-database";
import {
  SCRAPER_QUEUE_NAME,
  fetchHtml,
  isAllowedByRobots,
  RateLimiter,
  extractLinks,
  extractText,
  extractAttr,
  computeContentHash,
  DEFAULT_USER_AGENT,
  type ScraperCrawlJobData,
} from "@2blog/core-scraper-kit";

const MAX_ITEMS_PER_CRAWL = 20;
/** Conservative per-host default — one crawl target at a time isn't going to need more. */
const RATE_LIMIT_MAX_REQUESTS = 5;
const RATE_LIMIT_WINDOW_SECONDS = 10;

async function respectRateLimitAndRobots(url: string, rateLimiter: RateLimiter): Promise<void> {
  const hostname = new URL(url).hostname;
  const allowed = await rateLimiter.tryConsume(hostname);
  if (!allowed) throw new Error(`Rate limit exceeded for host ${hostname}`);
  const robotsOk = await isAllowedByRobots(url, DEFAULT_USER_AGENT);
  if (!robotsOk) throw new Error(`Blocked by robots.txt: ${url}`);
}

/**
 * SOURCE → CRAWL → RAW DATA → EXTRACTION → NORMALIZATION → CLASSIFICATION
 * → DUPLICATE CHECK (ARCHITECTURE.md madde 10) all happen synchronously in
 * this one job — REVIEW/APPROVAL/PUBLISH are separate admin actions against
 * `data_pool_items` (apps/api's DataPoolService), never done here. This
 * queue never writes a `contents` row.
 */
async function processCrawlJob(db: Database, rateLimiter: RateLimiter, data: ScraperCrawlJobData): Promise<void> {
  const { crawlJobId, sourceId, ruleId } = data;

  await db.update(schema.crawlJobs).set({ status: "RUNNING", startedAt: new Date() }).where(eq(schema.crawlJobs.id, crawlJobId));

  try {
    const [source] = await db.select().from(schema.scraperSources).where(eq(schema.scraperSources.id, sourceId)).limit(1);
    const [rule] = await db.select().from(schema.scraperRules).where(eq(schema.scraperRules.id, ruleId)).limit(1);
    if (!source || !rule) throw new Error("Scraper source or rule not found");

    await respectRateLimitAndRobots(source.listUrl, rateLimiter);
    const listHtml = await fetchHtml(source.listUrl);
    const itemLinks = extractLinks(listHtml, source.listItemSelector, source.listUrl).slice(0, MAX_ITEMS_PER_CRAWL);

    let itemsNew = 0;
    for (const link of itemLinks) {
      try {
        await respectRateLimitAndRobots(link, rateLimiter);
        const pageHtml = await fetchHtml(link);

        const title = extractText(pageHtml, rule.titleSelector);
        const body = extractText(pageHtml, rule.bodySelector);
        if (!title || !body) {
          console.warn(`[scraper] skipping ${link}: title/body selector matched nothing`);
          continue;
        }

        const excerpt = rule.excerptSelector ? extractText(pageHtml, rule.excerptSelector) : null;
        const coverImage = rule.coverImageSelector ? extractAttr(pageHtml, rule.coverImageSelector, rule.coverImageAttr) : null;
        const contentHash = computeContentHash(`${title}\n${body}`);

        const inserted = await db
          .insert(schema.rawDataItems)
          .values({ crawlJobId, sourceUrl: link, contentHash, rawTitle: title, rawBody: body, rawExcerpt: excerpt, rawCoverImage: coverImage })
          .onConflictDoNothing({ target: schema.rawDataItems.contentHash })
          .returning();

        const rawRow = inserted[0];
        if (!rawRow) continue; // duplicate — contentHash already existed (the DUPLICATE case)

        await db.insert(schema.dataPoolItems).values({
          rawDataItemId: rawRow.id,
          sourceId,
          typeKey: source.typeKey,
          title,
          excerpt,
          body,
          coverImage,
          status: "PROCESSED",
        });
        itemsNew++;
      } catch (itemError) {
        console.error(`[scraper] failed to process ${link}:`, itemError);
      }
    }

    await db
      .update(schema.crawlJobs)
      .set({ status: "SUCCESS", itemsFound: itemLinks.length, itemsNew, finishedAt: new Date() })
      .where(eq(schema.crawlJobs.id, crawlJobId));
  } catch (error) {
    await db
      .update(schema.crawlJobs)
      .set({ status: "FAILED", errorMessage: error instanceof Error ? error.message : String(error), finishedAt: new Date() })
      .where(eq(schema.crawlJobs.id, crawlJobId));
    throw error; // BullMQ also marks the job failed — visible in its own failed-job list (madde 7)
  }
}

export function createScraperWorker(db: Database, connection: IORedis, concurrency: number): Worker<ScraperCrawlJobData> {
  const rateLimiter = new RateLimiter(connection, RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_WINDOW_SECONDS);

  return new Worker<ScraperCrawlJobData>(
    SCRAPER_QUEUE_NAME,
    async (job: Job<ScraperCrawlJobData>) => {
      await processCrawlJob(db, rateLimiter, job.data);
    },
    { connection, concurrency },
  );
}
