import { pgTable, uuid, varchar, text, integer, timestamp, pgEnum, index } from "drizzle-orm/pg-core";
import { users } from "./users";

export const aiRequestStatusEnum = pgEnum("ai_request_status", ["SUCCESS", "FAILED"]);

/**
 * Core table (ARCHITECTURE.md madde 12: "Tüm çağrılar ai_requests'e
 * loglanır") — every AI generation call is logged here regardless of
 * which domain triggered it, same as `media`/`settings` sit at Core level
 * rather than under `blog/`. `resultRef` is free-form (e.g. a `contents.id`
 * once the caller saves the output as a draft) — Core doesn't know what a
 * caller does with the generated text.
 */
export const aiRequests = pgTable(
  "ai_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    provider: varchar("provider", { length: 50 }).notNull(),
    promptKey: varchar("prompt_key", { length: 100 }),
    prompt: text("prompt").notNull(),
    resultText: text("result_text"),
    resultRef: varchar("result_ref", { length: 255 }),
    tokensUsed: integer("tokens_used"),
    status: aiRequestStatusEnum("status").notNull(),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("ai_requests_user_id_idx").on(table.userId)],
);
