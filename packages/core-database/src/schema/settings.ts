import { pgTable, varchar, jsonb, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";

/**
 * One row per category (general/seo/social/...) rather than one row per
 * key — matches how the API is consumed (`GET/PATCH /settings/:category`,
 * ARCHITECTURE.md madde 15) and how it's rendered (a whole category is a
 * form section). `category` is the primary key: at most one row per
 * category, no separate uniqueness concern to enforce.
 */
export const settings = pgTable("settings", {
  category: varchar("category", { length: 50 }).primaryKey(),
  values: jsonb("values").notNull().default({}),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  updatedBy: uuid("updated_by").references(() => users.id, { onDelete: "set null" }),
});
