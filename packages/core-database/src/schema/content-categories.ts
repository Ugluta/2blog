import { pgTable, uuid, primaryKey } from "drizzle-orm/pg-core";
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
  (table) => [primaryKey({ columns: [table.contentId, table.categoryId] })],
);
