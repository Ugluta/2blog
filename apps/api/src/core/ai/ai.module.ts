import { Module } from "@nestjs/common";
import { AiController } from "./ai.controller";
import { AiService } from "./ai.service";

/**
 * Core module (ARCHITECTURE.md madde 12/14 — `packages/core-ai` under
 * `core/`, not `blog/`): AI generation is a generic capability any future
 * domain (Evrak, Koli, ...) can call, not Blog-specific. It exports
 * AiService (exposing `promptRegistry`) so domain modules can register
 * their own prompts into it, the same way they register content types
 * with ContentTypeRegistry — Core itself never registers a domain prompt.
 */
@Module({
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
