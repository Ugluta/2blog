import { pgTable, uuid, varchar, text, date, pgEnum } from "drizzle-orm/pg-core";
import { contents } from "./contents";

export const projectStatusEnum = pgEnum("project_status", [
  "CONCEPT",
  "PLANNING",
  "DEVELOPMENT",
  "COMPLETED",
  "MAINTENANCE",
  "ARCHIVED",
]);

/**
 * Extension table for typeKey="project" (ARCHITECTURE.md madde 5/8).
 * `contentId` is both PK and FK: a strict 1:1 with `contents`, and CASCADE
 * (unlike Core's RESTRICT-by-default) because this row has no meaning
 * without its parent — it is not itself a referenceable entity.
 *
 * `project_status` (CONCEPT..ARCHIVED, the project's real-world lifecycle)
 * is deliberately a separate concept from `contents.status` (the editorial
 * workflow, DRAFT..PUBLISHED) — a finished project's write-up can still be
 * a DRAFT, and a PUBLISHED write-up can describe a project still in
 * DEVELOPMENT.
 */
export const projectDetails = pgTable("project_details", {
  contentId: uuid("content_id")
    .primaryKey()
    .references(() => contents.id, { onDelete: "cascade" }),
  problem: text("problem"),
  solution: text("solution"),
  technologies: text("technologies").array().notNull().default([]),
  demoUrl: varchar("demo_url", { length: 2048 }),
  repoUrl: varchar("repo_url", { length: 2048 }),
  clientName: varchar("client_name", { length: 255 }),
  startDate: date("start_date", { mode: "string" }),
  endDate: date("end_date", { mode: "string" }),
  projectStatus: projectStatusEnum("project_status").notNull().default("CONCEPT"),
  results: text("results"),
});
