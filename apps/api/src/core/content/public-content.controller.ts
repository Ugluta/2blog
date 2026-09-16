import { Controller, Get, Param, Query } from "@nestjs/common";
import { publicContentListQuerySchema, slugParamSchema, type PublicContentListQuery } from "@2blog/validation";
import type { ApiSuccess, Content, CursorPage } from "@2blog/types";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { ContentService } from "./content.service";

/**
 * No guard — this is what apps/web calls during SSR (ARCHITECTURE.md madde 2/3:
 * web never queries the database directly, and never sees non-PUBLISHED
 * content). Kept as separate routes from ContentController rather than an
 * optional-auth branch on the same routes, so "what an anonymous visitor can
 * see" stays an explicit, reviewable surface.
 */
@Controller("content/public")
export class PublicContentController {
  constructor(private readonly contentService: ContentService) {}

  @Get()
  async list(@Query(new ZodValidationPipe(publicContentListQuerySchema)) query: PublicContentListQuery): Promise<ApiSuccess<CursorPage<Content>>> {
    return { data: await this.contentService.listPublic(query) };
  }

  @Get(":slug")
  async findBySlug(@Param(new ZodValidationPipe(slugParamSchema)) params: { slug: string }): Promise<ApiSuccess<Content>> {
    return { data: await this.contentService.findPublicBySlug(params.slug) };
  }
}
