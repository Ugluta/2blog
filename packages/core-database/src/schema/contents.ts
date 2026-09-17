import { pgTable, uuid, varchar, text, boolean, timestamp, pgEnum, index } from "drizzle-orm/pg-core";
import { users } from "./users";

export const contentStatusEnum = pgEnum("content_status", [
  "DRAFT",
  "REVIEW",
  "APPROVED",
  "SCHEDULED",
  "PUBLISHED",
  "ARCHIVED",
]);

/**
 * Generic Content Engine table (ARCHITECTURE.md madde 5/6) — `typeKey` is a
 * plain string, not a DB enum, because domain modules register new types at
 * application bootstrap (Blog's "post", Evrak's "document", ...); Core has
 * no fixed list to encode into the schema. Type-specific extra fields live
 * in per-type extension tables added when each domain needs them, not here.
 */
export const contents = pgTable(
  "contents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    typeKey: varchar("type_key", { length: 50 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    excerpt: text("excerpt"),
    body: text("body"),
    status: contentStatusEnum("status").notNull().default("DRAFT"),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    coverImage: varchar("cover_image", { length: 2048 }),
    seoTitle: varchar("seo_title", { length: 255 }),
    seoDescription: varchar("seo_description", { length: 500 }),
    canonicalUrl: varchar("canonical_url", { length: 2048 }),
    noindex: boolean("noindex").notNull().default(false),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  // Every domain's list()/listPublic() filters by typeKey and/or status
  // (ContentService.listInternal) — Postgres doesn't index these for free.
  (table) => [index("contents_status_idx").on(table.status), index("contents_type_key_idx").on(table.typeKey)],
);
