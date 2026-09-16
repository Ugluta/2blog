import { Global, Module } from "@nestjs/common";
import IORedis from "ioredis";
import { loadEnv, redisEnvSchema } from "@2blog/config";
import { REDIS_CONNECTION } from "./cache.constants";

/**
 * First real Redis usage in apps/api (ARCHITECTURE.md madde 7: cache/rate
 * limiting/BullMQ backend — "primary database değildir"). Mirrors
 * DatabaseModule's DI-token pattern so any future Core module (not just
 * Scraper) can inject REDIS_CONNECTION without knowing ioredis specifics.
 */
@Global()
@Module({
  providers: [
    {
      provide: REDIS_CONNECTION,
      useFactory: () => {
        const env = loadEnv(redisEnvSchema);
        return new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });
      },
    },
  ],
  exports: [REDIS_CONNECTION],
})
export class CacheModule {}
