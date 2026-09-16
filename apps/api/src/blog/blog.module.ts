import { Inject, Module, OnModuleInit } from "@nestjs/common";
import { z } from "zod";
import { ContentTypeRegistry } from "@2blog/core-content-engine";
import { CONTENT_TYPE_REGISTRY } from "../core/content/content-type-registry.constants";

/**
 * Blog is Core's first domain module, not a special case Core knows about
 * (ARCHITECTURE.md madde 5/7). It only talks to Core through the
 * ContentTypeRegistry token — nothing here reaches into ContentModule's
 * internals, and nothing in Core imports from this file.
 */
@Module({})
export class BlogModule implements OnModuleInit {
  constructor(@Inject(CONTENT_TYPE_REGISTRY) private readonly registry: ContentTypeRegistry) {}

  onModuleInit() {
    this.registry.register({
      key: "post",
      label: "Blog Yazısı",
      extraFieldsSchema: z.object({}).strict(),
    });
  }
}
