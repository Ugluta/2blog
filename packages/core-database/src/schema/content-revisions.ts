import { pgTable, uuid, varchar, text, timestamp, index } from "drizzle-orm/pg-core";
import { contents, contentStatusEnum } from "./contents";
import { users } from "./users";

/** Snapshot taken on every content update — audit trail, not a diff/patch store. */
export const contentRevisions = pgTable(
  "content_revisions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    contentId: uuid("content_id")
      .notNull()
      .references(() => contents.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    excerpt: text("excerpt"),
    body: text("body"),
    status: contentStatusEnum("status").notNull(),
    editedBy: uuid("edited_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("content_revisions_content_id_idx").on(table.contentId)],
);
