import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import fastifyMultipart from "@fastify/multipart";
import { loadEnv, apiEnvSchema } from "@2blog/config";
import { AppModule } from "./app.module";

async function bootstrap() {
  const env = loadEnv(apiEnvSchema);

  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());

  await app.register(fastifyMultipart, {
    limits: { fileSize: env.MEDIA_MAX_UPLOAD_MB * 1024 * 1024, files: 1 },
  });

  app.setGlobalPrefix("api/v1");
  app.enableCors({
    origin: env.CORS_ORIGINS.length > 0 ? env.CORS_ORIGINS : false,
    credentials: true,
  });

  await app.listen(env.API_PORT, "0.0.0.0");
}

bootstrap();
