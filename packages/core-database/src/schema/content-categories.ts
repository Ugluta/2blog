import { pgTable, uuid, primaryKey, index } from "drizzle-orm/pg-core";
import { contents } from "./contents";
import { categories } from "./categories";

export const contentCategories = pgTable(
  "content_categories",
  {
    contentId: uuid("content_id")
      .notNull()
      .references(() => contents.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
  },
  // The PK covers "categories for this content" (contentId is its leftmost
  // column); ContentService.listInternal's categoryId filter needs the
  // reverse direction, which the PK alone can't serve.
  (table) => [primaryKey({ columns: [table.contentId, table.categoryId] }), index("content_categories_category_id_idx").on(table.categoryId)],
);
