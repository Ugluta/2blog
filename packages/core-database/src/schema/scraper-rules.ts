import { pgTable, uuid, varchar, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { scraperSources } from "./scraper-sources";

/**
 * A source can have more than one extraction rule set over time (a site
 * redesign changes selectors without losing crawl history tied to the old
 * rule) — ARCHITECTURE.md madde 10's `ScraperSource ──< ScraperRule`.
 * `RESTRICT` (not CASCADE) because a rule with crawl-job history shouldn't
 * silently vanish along with its source in a delete.
 */
export const scraperRules = pgTable(
  "scraper_rules",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sourceId: uuid("source_id")
      .notNull()
      .references(() => scraperSources.id, { onDelete: "restrict" }),
    name: varchar("name", { length: 255 }).notNull(),
    titleSelector: varchar("title_selector", { length: 500 }).notNull(),
    bodySelector: varchar("body_selector", { length: 500 }).notNull(),
    excerptSelector: varchar("excerpt_selector", { length: 500 }),
    coverImageSelector: varchar("cover_image_selector", { length: 500 }),
    coverImageAttr: varchar("cover_image_attr", { length: 50 }).notNull().default("src"),
    isEnabled: boolean("is_enabled").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  // ScraperRulesService.listBySource filters by sourceId directly.
  (table) => [index("scraper_rules_source_id_idx").on(table.sourceId)],
);
