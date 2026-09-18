import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import fastifyHelmet from "@fastify/helmet";
import fastifyMultipart from "@fastify/multipart";
import { loadEnv, apiEnvSchema } from "@2blog/config";
import { AppModule } from "./app.module";

async function bootstrap() {
  const env = loadEnv(apiEnvSchema);

  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());

  // Defense in depth — Caddy already sets some of these at the edge in
  // production (infrastructure/caddy/Caddyfile), but the API applies
  // them itself too so they're present in local dev (no Caddy in front)
  // and if the API is ever reached directly. Every response here is
  // JSON, never HTML, so CSP is largely moot; the headers that matter
  // for a JSON API are noSniff/frameguard/hidePoweredBy, which are on
  // by default.
  await app.register(fastifyHelmet);

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
