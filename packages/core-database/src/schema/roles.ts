import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";

/**
 * Roles are data, not an enum (madde 14, master prompt: "roller hard-coded
 * olmak zorunda değil, admin yeni rol oluşturabilmeli").
 */
export const roles = pgTable("roles", {
  id: uuid("id").defaultRandom().primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  label: varchar("label", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
