import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";

/**
 * Core identity table (ARCHITECTURE.md madde 6/9). Domain-specific profile
 * attributes (e.g. Evrak's teacherLevel) are never added here — each domain
 * module owns its own profile table, FK'd to users.id.
 */
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  displayName: varchar("display_name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});
