import { Inject, Module, OnModuleInit } from "@nestjs/common";
import { z } from "zod";
import { ContentTypeRegistry } from "@2blog/core-content-engine";
import { CONTENT_TYPE_REGISTRY } from "../core/content/content-type-registry.constants";
import { AiModule } from "../core/ai/ai.module";
import { AiService } from "../core/ai/ai.service";
import { ProjectsModule } from "./projects/projects.module";
import { ServicesModule } from "./services/services.module";
import { WorksModule } from "./works/works.module";
import { ToolsModule } from "./tools/tools.module";
import { ScraperModule } from "./scraper/scraper.module";

/**
 * Blog is Core's first domain module, not a special case Core knows about
 * (ARCHITECTURE.md madde 5/7). It only talks to Core through the
 * ContentTypeRegistry token — nothing here reaches into ContentModule's
 * internals, and nothing in Core imports from this file.
 *
 * "project"/"service"/"work"/"tool" register here with an empty extraFieldsSchema
 * because their real fields never go through the generic /content
 * extraFields path — ProjectsService/ServicesService/WorksService/ToolsService
 * validate and persist them directly against their own extension tables. Registering
 * the typeKey is still required so generic endpoints (e.g. `/content?typeKey=
 * project`) recognize it instead of 400ing as unknown.
 */
@Module({
  imports: [ProjectsModule, ServicesModule, WorksModule, ToolsModule, ScraperModule, AiModule],
})
export class BlogModule implements OnModuleInit {
  constructor(
    @Inject(CONTENT_TYPE_REGISTRY) private readonly registry: ContentTypeRegistry,
    private readonly aiService: AiService,
  ) {}

  onModuleInit() {
    const noExtraFields = z.object({}).strict();
    this.registry.register({ key: "post", label: "Blog Yazısı", extraFieldsSchema: noExtraFields });
    this.registry.register({ key: "project", label: "Proje", extraFieldsSchema: noExtraFields });
    this.registry.register({ key: "service", label: "Hizmet", extraFieldsSchema: noExtraFields });
    this.registry.register({ key: "work", label: "Yaptığımız İş", extraFieldsSchema: noExtraFields });
    this.registry.register({ key: "tool", label: "Araç", extraFieldsSchema: noExtraFields });

    this.aiService.promptRegistry.register({
      key: "blog-post-draft",
      version: 1,
      template: "Write a short blog post draft about: {{topic}}. Keep it under 200 words, plain text, no markdown formatting.",
    });
  }
}
