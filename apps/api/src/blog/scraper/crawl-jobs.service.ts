import { Inject, Injectable, NotFoundException, OnModuleDestroy } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { Queue } from "bullmq";
import type Redis from "ioredis";
import { schema, type Database } from "@2blog/core-database";
import { SCRAPER_QUEUE_NAME, type ScraperCrawlJobData } from "@2blog/core-scraper-kit";
import type { TriggerCrawlInput, CrawlJobListQuery } from "@2blog/validation";
import type { CrawlJob } from "@2blog/types";
import { DATABASE_CONNECTION } from "../../core/database/database.constants";
import { REDIS_CONNECTION } from "../../core/cache/cache.constants";

type JobRow = typeof schema.crawlJobs.$inferSelect;

/**
 * The API only ever creates a PENDING row and enqueues it — RUNNING/
 * SUCCESS/FAILED transitions happen in apps/worker (ARCHITECTURE.md madde
 * 7: "Uzun süren hiçbir işlem HTTP request içinde çalıştırılmaz").
 */
@Injectable()
export class CrawlJobsService implements OnModuleDestroy {
  private readonly queue: Queue<ScraperCrawlJobData>;

  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
    @Inject(REDIS_CONNECTION) redis: Redis,
  ) {
    this.queue = new Queue(SCRAPER_QUEUE_NAME, { connection: redis });
  }

  async onModuleDestroy() {
    await this.queue.close();
  }

  async trigger(input: TriggerCrawlInput, triggeredBy: string): Promise<CrawlJob> {
    const [rule] = await this.db.select().from(schema.scraperRules).where(eq(schema.scraperRules.id, input.ruleId)).limit(1);
    if (!rule || rule.sourceId !== input.sourceId) {
      throw new NotFoundException("Scraper rule not found for this source");
    }

    const [job] = await this.db
      .insert(schema.crawlJobs)
      .values({ sourceId: input.sourceId, ruleId: input.ruleId, status: "PENDING", triggeredBy })
      .returning();

    await this.queue.add("crawl", { crawlJobId: job!.id, sourceId: input.sourceId, ruleId: input.ruleId });

    return this.toApiShape(job!);
  }

  async list(query: CrawlJobListQuery): Promise<CrawlJob[]> {
    const rows = await this.db
      .select()
      .from(schema.crawlJobs)
      .where(query.sourceId ? eq(schema.crawlJobs.sourceId, query.sourceId) : undefined)
      .orderBy(schema.crawlJobs.createdAt);
    return rows.map(this.toApiShape);
  }

  private toApiShape(row: JobRow): CrawlJob {
    return {
      id: row.id,
      sourceId: row.sourceId,
      ruleId: row.ruleId,
      status: row.status,
      itemsFound: row.itemsFound,
      itemsNew: row.itemsNew,
      errorMessage: row.errorMessage,
      triggeredBy: row.triggeredBy,
      startedAt: row.startedAt?.toISOString() ?? null,
      finishedAt: row.finishedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
