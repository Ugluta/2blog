import { pgTable, uuid, varchar, timestamp, index } from "drizzle-orm/pg-core";
import { users } from "./users";

/**
 * Refresh-token rotation chain (ARCHITECTURE.md madde 8).
 *
 * - The raw refresh token is never stored — only `refreshTokenHash` (SHA-256).
 * - `family` groups every token issued along one rotation chain. On refresh,
 *   the current row is marked `revokedAt` and a new row is inserted with the
 *   same `family`. If a revoked token is presented again (reuse), the entire
 *   family is revoked — not just the one row.
 */
export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    family: uuid("family").notNull(),
    refreshTokenHash: varchar("refresh_token_hash", { length: 64 }).notNull().unique(),
    userAgent: varchar("user_agent", { length: 512 }),
    ipAddress: varchar("ip_address", { length: 45 }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  // `family` is looked up on every refresh/logout/reuse-detection (AuthService)
  // — the hottest query this table gets outside the already-unique refreshTokenHash.
  (table) => [index("sessions_family_idx").on(table.family), index("sessions_user_id_idx").on(table.userId)],
);
