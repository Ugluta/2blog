import { pgTable, uuid, primaryKey } from "drizzle-orm/pg-core";
import { contents } from "./contents";
import { tags } from "./tags";

export const contentTags = pgTable(
  "content_tags",
  {
    contentId: uuid("content_id")
      .notNull()
      .references(() => contents.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.contentId, table.tagId] })],
);
