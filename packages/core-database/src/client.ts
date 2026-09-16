import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type Database = ReturnType<typeof createDatabase>;

/**
 * One factory, not a module-level singleton — apps/api, apps/worker, and
 * scripts each create their own connection with their own pool sizing
 * instead of sharing hidden global state.
 */
export function createDatabase(databaseUrl: string) {
  const queryClient = postgres(databaseUrl);
  return drizzle(queryClient, { schema });
}
