import { pgTable, uuid, varchar, text, timestamp } from "drizzle-orm/pg-core";

/**
 * A separate table from Core's generic `categories` (blog taxonomy) —
 * "Hizmet Kategorileri → Hizmetler" is a domain-specific hierarchy owned by
 * Blog, not a Core concept (ARCHITECTURE.md madde 6, Domain tabloları).
 */
export const serviceCategories = pgTable("service_categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
