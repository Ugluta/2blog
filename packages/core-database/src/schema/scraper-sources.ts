import { pgTable, uuid, varchar, boolean, timestamp } from "drizzle-orm/pg-core";

/**
 * Domain table (Blog — ARCHITECTURE.md madde 10/6): the scraper *mechanism*
 * (HTTP client, robots.txt check, rate limiting, parsing helpers) lives in
 * Core's `packages/core-scraper-kit`; which sites exist and how their
 * listing pages are structured is domain knowledge, so this table — like
 * `project_details`/`service_details` — lives next to Core's tables in the
 * physical schema but is only ever written to by `apps/api/src/blog/scraper`.
 *
 * `scheduleCron` is stored for a future scheduler phase but not read by
 * anything yet — this phase's crawls are triggered manually from the admin
 * panel (documented scope cut, PHASE_LOG.md).
 */
export const scraperSources = pgTable("scraper_sources", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  baseUrl: varchar("base_url", { length: 2048 }).notNull(),
  listUrl: varchar("list_url", { length: 2048 }).notNull(),
  listItemSelector: varchar("list_item_selector", { length: 500 }).notNull(),
  typeKey: varchar("type_key", { length: 50 }).notNull().default("post"),
  scheduleCron: varchar("schedule_cron", { length: 100 }),
  isEnabled: boolean("is_enabled").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
