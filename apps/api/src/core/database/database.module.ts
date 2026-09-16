import { Global, Module } from "@nestjs/common";
import { loadEnv, databaseEnvSchema } from "@2blog/config";
import { createDatabase } from "@2blog/core-database";
import { DATABASE_CONNECTION } from "./database.constants";

@Global()
@Module({
  providers: [
    {
      provide: DATABASE_CONNECTION,
      useFactory: () => {
        const env = loadEnv(databaseEnvSchema);
        return createDatabase(env.DATABASE_URL);
      },
    },
  ],
  exports: [DATABASE_CONNECTION],
})
export class DatabaseModule {}
