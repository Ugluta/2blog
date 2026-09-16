import { z } from "zod";

/**
 * Each schema below validates only the variables the calling app actually needs —
 * apps/web has no business requiring JWT_ACCESS_SECRET, apps/worker has no business
 * requiring CORS_ORIGINS, etc. Compose with `.merge()` in the app that needs more than one.
 */

export const nodeEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "staging", "production"]).default("development"),
});

export const databaseEnvSchema = z.object({
  DATABASE_URL: z.string().url(),
});

export const redisEnvSchema = z.object({
  REDIS_URL: z.string().url(),
});

export const storageEnvSchema = z.object({
  STORAGE_ENDPOINT: z.string().min(1),
  STORAGE_PORT: z.coerce.number().int().positive(),
  STORAGE_USE_SSL: z
    .string()
    .transform((value) => value === "true")
    .default("false"),
  STORAGE_ACCESS_KEY: z.string().min(1),
  STORAGE_SECRET_KEY: z.string().min(1),
  STORAGE_BUCKET: z.string().min(1),
});

export const authEnvSchema = z.object({
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_ACCESS_TTL: z.string().default("15m"),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_REFRESH_TTL: z.string().default("30d"),
});

export const apiEnvSchema = nodeEnvSchema
  .merge(databaseEnvSchema)
  .merge(redisEnvSchema)
  .merge(storageEnvSchema)
  .merge(authEnvSchema)
  .extend({
    API_PORT: z.coerce.number().int().positive().default(4000),
    CORS_ORIGINS: z
      .string()
      .default("")
      .transform((value) => value.split(",").map((origin) => origin.trim()).filter(Boolean)),
    MEDIA_MAX_UPLOAD_MB: z.coerce.number().int().positive().default(25),
  });

export const workerEnvSchema = nodeEnvSchema
  .merge(databaseEnvSchema)
  .merge(redisEnvSchema)
  .merge(storageEnvSchema)
  .extend({
    WORKER_CONCURRENCY: z.coerce.number().int().positive().default(5),
  });

export const webEnvSchema = nodeEnvSchema.extend({
  WEB_PORT: z.coerce.number().int().positive().default(3000),
  NEXT_PUBLIC_SITE_URL: z.string().url(),
  API_INTERNAL_URL: z.string().url(),
});

export const adminEnvSchema = nodeEnvSchema.extend({
  ADMIN_PORT: z.coerce.number().int().positive().default(3001),
  NEXT_PUBLIC_ADMIN_URL: z.string().url(),
  API_INTERNAL_URL: z.string().url(),
});

export type ApiEnv = z.infer<typeof apiEnvSchema>;
export type WorkerEnv = z.infer<typeof workerEnvSchema>;
export type WebEnv = z.infer<typeof webEnvSchema>;
export type AdminEnv = z.infer<typeof adminEnvSchema>;

/**
 * Fails fast with a readable message instead of letting an app boot with
 * missing/malformed configuration (a null port, an empty secret, ...).
 */
export function loadEnv<Schema extends z.ZodTypeAny>(
  schema: Schema,
  source: NodeJS.ProcessEnv = process.env,
): z.infer<Schema> {
  const result = schema.safeParse(source);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return result.data;
}
