import IORedis from "ioredis";
import { loadEnv, workerEnvSchema } from "@2blog/config";

const env = loadEnv(workerEnvSchema);

/**
 * BullMQ requires `maxRetriesPerRequest: null` on the connection it manages —
 * without it, BullMQ's internal blocking commands (used for job polling) can
 * be retried and time out in ways that corrupt queue state.
 */
export const connection = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

export { env };
