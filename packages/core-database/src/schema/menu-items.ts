import { pgTable, uuid, varchar, integer, boolean, timestamp } from "drizzle-orm/pg-core";

/**
 * Flat list, no parent/child nesting — the public site nav (master prompt
 * madde 3) is a flat set of top-level links; nested admin-sidebar-style
 * menus are a different concept (madde 23) not needed here. Add a
 * self-referencing parentId later if a real nested-menu need shows up.
 */
export const menuItems = pgTable("menu_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  label: varchar("label", { length: 100 }).notNull(),
  url: varchar("url", { length: 2048 }).notNull(),
  position: integer("position").notNull().default(0),
  isVisible: boolean("is_visible").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
