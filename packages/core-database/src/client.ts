import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type Database = ReturnType<typeof createDatabase>;

/**
 * The type Drizzle passes into a `db.transaction(async (tx) => ...)`
 * callback — extracted rather than hand-typed so it can never drift from
 * whatever Drizzle actually provides. Used wherever a caller needs to
 * participate in an existing transaction (e.g. a domain module writing its
 * extension-table row in the same transaction as the Content Engine's
 * insert) instead of opening a second one.
 */
export type Transaction = Parameters<Database["transaction"]>[0] extends (tx: infer T) => unknown ? T : never;

/**
 * One factory, not a module-level singleton — apps/api, apps/worker, and
 * scripts each create their own connection with their own pool sizing
 * instead of sharing hidden global state.
 */
export function createDatabase(databaseUrl: string) {
  const queryClient = postgres(databaseUrl);
  return drizzle(queryClient, { schema });
}
