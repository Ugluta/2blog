import { pgTable, uuid, integer, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { scraperSources } from "./scraper-sources";
import { scraperRules } from "./scraper-rules";
import { users } from "./users";

export const crawlJobStatusEnum = pgEnum("crawl_job_status", ["PENDING", "RUNNING", "SUCCESS", "FAILED"]);

/**
 * One row per crawl execution — the audit trail for
 * `ScraperRule ──< CrawlJob ──< RawDataItem` (ARCHITECTURE.md madde 10).
 * Created as PENDING by the API when a crawl is triggered (enqueues a
 * BullMQ `scraper` job with this row's id), then the worker moves it
 * through RUNNING → SUCCESS/FAILED.
 */
export const crawlJobs = pgTable("crawl_jobs", {
  id: uuid("id").defaultRandom().primaryKey(),
  sourceId: uuid("source_id")
    .notNull()
    .references(() => scraperSources.id, { onDelete: "restrict" }),
  ruleId: uuid("rule_id")
    .notNull()
    .references(() => scraperRules.id, { onDelete: "restrict" }),
  status: crawlJobStatusEnum("status").notNull().default("PENDING"),
  itemsFound: integer("items_found").notNull().default(0),
  itemsNew: integer("items_new").notNull().default(0),
  errorMessage: text("error_message"),
  triggeredBy: uuid("triggered_by").references(() => users.id, { onDelete: "set null" }),
  startedAt: timestamp("started_at", { withTimezone: true }),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
