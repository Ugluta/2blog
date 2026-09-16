import { Global, Module } from "@nestjs/common";
import { loadEnv, storageEnvSchema } from "@2blog/config";
import { S3StorageProvider } from "@2blog/core-media";
import { STORAGE_PROVIDER } from "./media.constants";

/**
 * Fails fast at boot if the bucket can't be created/verified — storage is a
 * required dependency, same posture as DatabaseModule. Swapping MinIO for
 * R2/S3 later is a config change here only (ARCHITECTURE.md madde 13).
 */
@Global()
@Module({
  providers: [
    {
      provide: STORAGE_PROVIDER,
      useFactory: async () => {
        const env = loadEnv(storageEnvSchema);
        const provider = new S3StorageProvider({
          endpoint: env.STORAGE_ENDPOINT,
          port: env.STORAGE_PORT,
          useSSL: env.STORAGE_USE_SSL,
          accessKeyId: env.STORAGE_ACCESS_KEY,
          secretAccessKey: env.STORAGE_SECRET_KEY,
          bucket: env.STORAGE_BUCKET,
        });
        await provider.ensureBucket();
        return provider;
      },
    },
  ],
  exports: [STORAGE_PROVIDER],
})
export class StorageModule {}
