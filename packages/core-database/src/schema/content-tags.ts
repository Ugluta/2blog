import { pgTable, uuid, primaryKey, index } from "drizzle-orm/pg-core";
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
  // Same reasoning as content_categories — the reverse (by-tag) direction
  // needs its own index, the PK only covers by-content.
  (table) => [primaryKey({ columns: [table.contentId, table.tagId] }), index("content_tags_tag_id_idx").on(table.tagId)],
);
