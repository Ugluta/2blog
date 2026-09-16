import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";

/**
 * Granular permission strings (e.g. BLOG_PUBLISH, PROJECT_EDIT, AI_IMAGE).
 * Core does not know which domain owns a given key — domain modules register
 * their own permission keys at bootstrap.
 */
export const permissions = pgTable("permissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  key: varchar("key", { length: 150 }).notNull().unique(),
  label: varchar("label", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
