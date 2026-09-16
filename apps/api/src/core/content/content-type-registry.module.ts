import { Global, Module } from "@nestjs/common";
import { ContentTypeRegistry } from "@2blog/core-content-engine";
import { CONTENT_TYPE_REGISTRY } from "./content-type-registry.constants";

/**
 * One process-wide registry instance. Domain modules (BlogModule, ...) inject
 * this token and call `.register()` in their own OnModuleInit — Core never
 * lists their types itself (ARCHITECTURE.md madde 5).
 */
@Global()
@Module({
  providers: [{ provide: CONTENT_TYPE_REGISTRY, useValue: new ContentTypeRegistry() }],
  exports: [CONTENT_TYPE_REGISTRY],
})
export class ContentTypeRegistryModule {}
