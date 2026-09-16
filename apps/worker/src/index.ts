import { connection, env } from "./redis";

async function main() {
  await connection.ping();
  console.log(`[worker] connected to Redis, concurrency=${env.WORKER_CONCURRENCY}`);
  console.log("[worker] no queues registered yet — processors are added per phase (scraper, ai-generation, media-processing, social-publish, email, notifications, import-export)");
}

main().catch((error) => {
  console.error("[worker] failed to start", error);
  process.exit(1);
});

process.on("SIGTERM", async () => {
  await connection.quit();
  process.exit(0);
});
