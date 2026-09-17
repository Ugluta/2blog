import { pgTable, uuid, varchar, text, jsonb, index } from "drizzle-orm/pg-core";
import { contents } from "./contents";
import { serviceCategories } from "./service-categories";

export interface ServiceFaqEntry {
  question: string;
  answer: string;
}

/** Extension table for typeKey="service" — see project-details.ts for the 1:1/CASCADE rationale. */
export const serviceDetails = pgTable(
  "service_details",
  {
    contentId: uuid("content_id")
      .primaryKey()
      .references(() => contents.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id").references(() => serviceCategories.id, { onDelete: "set null" }),
    features: text("features").array().notNull().default([]),
    process: text("process").array().notNull().default([]),
    faq: jsonb("faq").$type<ServiceFaqEntry[]>().notNull().default([]),
    ctaLabel: varchar("cta_label", { length: 255 }),
    ctaUrl: varchar("cta_url", { length: 2048 }),
  },
  // ServicesService resolves "which contentIds are in this category" by
  // querying this column directly (restrictToIds mechanism).
  (table) => [index("service_details_category_id_idx").on(table.categoryId)],
);
