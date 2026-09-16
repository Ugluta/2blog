import { pgTable, uuid, varchar, text, date, jsonb } from "drizzle-orm/pg-core";
import { contents } from "./contents";

export interface WorkLink {
  label: string;
  url: string;
}

/**
 * Extension table for typeKey="work". Deliberately looser than Project —
 * `category` is a plain label, not a managed taxonomy (master prompt madde
 * 6: "Yaptıklarımız ile projeler aynı veri modeli olmak zorunda değildir").
 */
export const workDetails = pgTable("work_details", {
  contentId: uuid("content_id")
    .primaryKey()
    .references(() => contents.id, { onDelete: "cascade" }),
  category: varchar("category", { length: 255 }),
  technologies: text("technologies").array().notNull().default([]),
  result: text("result"),
  links: jsonb("links").$type<WorkLink[]>().notNull().default([]),
  workDate: date("work_date", { mode: "string" }),
});
