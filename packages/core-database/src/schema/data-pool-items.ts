import { pgTable, uuid, varchar, text, timestamp, pgEnum, index } from "drizzle-orm/pg-core";
import { rawDataItems } from "./raw-data-items";
import { scraperSources } from "./scraper-sources";
import { contents } from "./contents";
import { users } from "./users";

/**
 * ARCHITECTURE.md madde 10: `DataPoolItem: RAW → PROCESSED → (DUPLICATE|
 * REJECTED|READY) → PUBLISHED → Content`. RAW itself is never persisted
 * here — extraction happens synchronously during the crawl, so a row is
 * only ever created already at PROCESSED (or the crawl short-circuits at
 * the `raw_data_items.contentHash` unique constraint, which *is* the
 * DUPLICATE case, before a `data_pool_items` row would exist at all).
 * REVIEW is an admin action (approve → READY, reject → REJECTED); PUBLISH
 * creates the real `contents` row and only then sets `contentId`.
 */
export const dataPoolStatusEnum = pgEnum("data_pool_status", ["PROCESSED", "REJECTED", "READY", "PUBLISHED"]);

export const dataPoolItems = pgTable(
  "data_pool_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    rawDataItemId: uuid("raw_data_item_id")
      .notNull()
      .unique()
      .references(() => rawDataItems.id, { onDelete: "restrict" }),
    sourceId: uuid("source_id")
      .notNull()
      .references(() => scraperSources.id, { onDelete: "restrict" }),
    typeKey: varchar("type_key", { length: 50 }).notNull(),
    title: text("title").notNull(),
    slug: varchar("slug", { length: 255 }),
    excerpt: text("excerpt"),
    body: text("body"),
    coverImage: varchar("cover_image", { length: 2048 }),
    status: dataPoolStatusEnum("status").notNull().default("PROCESSED"),
    contentId: uuid("content_id").references(() => contents.id, { onDelete: "set null" }),
    reviewedBy: uuid("reviewed_by").references(() => users.id, { onDelete: "set null" }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    rejectionReason: text("rejection_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  // DataPoolService.list filters by status (admin's Veri Havuzu status tabs).
  (table) => [index("data_pool_items_status_idx").on(table.status), index("data_pool_items_source_id_idx").on(table.sourceId)],
);
