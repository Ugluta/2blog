import { loadEnv, databaseEnvSchema } from "@2blog/config";
import { createDatabase } from "@2blog/core-database";
import { connection, env } from "./redis";
import { createScraperWorker } from "./processors/scraper.processor";

async function main() {
  await connection.ping();
  console.log(`[worker] connected to Redis, concurrency=${env.WORKER_CONCURRENCY}`);

  const dbEnv = loadEnv(databaseEnvSchema);
  const db = createDatabase(dbEnv.DATABASE_URL);

  const scraperWorker = createScraperWorker(db, connection, env.WORKER_CONCURRENCY);
  scraperWorker.on("failed", (job, error) => {
    console.error(`[worker] scraper job ${job?.id} failed:`, error.message);
  });
  console.log("[worker] scraper queue processor registered");
  console.log("[worker] other queues not registered yet — added per phase (ai-generation, media-processing, social-publish, email, notifications, import-export)");

  process.on("SIGTERM", async () => {
    await scraperWorker.close();
    await connection.quit();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error("[worker] failed to start", error);
  process.exit(1);
});
