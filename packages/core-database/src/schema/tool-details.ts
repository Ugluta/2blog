import { pgTable, uuid, varchar, text } from "drizzle-orm/pg-core";
import { contents } from "./contents";

/**
 * Extension table for typeKey="tool". `embedUrl` is iframed on the public
 * tool page (SafeIframe, sandboxed — admin-controlled but points at an
 * arbitrary external URL, same trust model as coverImage elsewhere: the
 * RBAC boundary is who can set it, not what it points to).
 */
export const toolDetails = pgTable("tool_details", {
  contentId: uuid("content_id")
    .primaryKey()
    .references(() => contents.id, { onDelete: "cascade" }),
  embedUrl: varchar("embed_url", { length: 2048 }).notNull(),
  category: varchar("category", { length: 255 }),
  instructions: text("instructions"),
});
