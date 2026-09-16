import { defineConfig } from "drizzle-kit";
import { loadEnv, databaseEnvSchema } from "@2blog/config";

const env = loadEnv(databaseEnvSchema);

export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
  strict: true,
  verbose: true,
});
