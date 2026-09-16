import { pgTable, uuid, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { crawlJobs } from "./crawl-jobs";

/**
 * The untouched extraction output for one crawled page, before any
 * normalization/classification (ARCHITECTURE.md madde 10's RAW stage).
 * `contentHash` (sha256 of normalized title+body, `core-scraper-kit`'s
 * `computeContentHash`) is unique — the worker's insert uses
 * `onConflictDoNothing` against it, which *is* the duplicate check: a
 * second crawl hitting the same or a re-published-elsewhere page never
 * creates a second row or a second `data_pool_items` entry.
 */
export const rawDataItems = pgTable("raw_data_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  crawlJobId: uuid("crawl_job_id")
    .notNull()
    .references(() => crawlJobs.id, { onDelete: "restrict" }),
  sourceUrl: varchar("source_url", { length: 2048 }).notNull(),
  contentHash: varchar("content_hash", { length: 64 }).notNull().unique(),
  rawTitle: text("raw_title"),
  rawBody: text("raw_body"),
  rawExcerpt: text("raw_excerpt"),
  rawCoverImage: varchar("raw_cover_image", { length: 2048 }),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
