import { pgTable, uuid, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";

/**
 * Metadata only — binary bytes live in object storage, never in Postgres
 * (ARCHITECTURE.md madde 13). `hash` is unique so re-uploading identical
 * bytes returns the existing row instead of duplicating storage (master
 * prompt madde 8: "aynı veriyi tekrar tekrar kaydetme").
 */
export const media = pgTable("media", {
  id: uuid("id").defaultRandom().primaryKey(),
  storageKey: varchar("storage_key", { length: 255 }).notNull().unique(),
  originalFilename: varchar("original_filename", { length: 255 }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  size: integer("size").notNull(),
  width: integer("width"),
  height: integer("height"),
  duration: integer("duration"),
  altText: varchar("alt_text", { length: 500 }),
  caption: varchar("caption", { length: 1000 }),
  hash: varchar("hash", { length: 64 }).notNull().unique(),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
