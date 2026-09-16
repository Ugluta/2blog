import { Controller, Get, Param, Query } from "@nestjs/common";
import { workListQuerySchema, slugParamSchema, type WorkListQuery } from "@2blog/validation";
import type { ApiSuccess, CursorPage, Work } from "@2blog/types";
import { ZodValidationPipe } from "../../core/common/zod-validation.pipe";
import { WorksService } from "./works.service";

@Controller("works/public")
export class WorksPublicController {
  constructor(private readonly worksService: WorksService) {}

  @Get()
  async list(@Query(new ZodValidationPipe(workListQuerySchema)) query: WorkListQuery): Promise<ApiSuccess<CursorPage<Work>>> {
    return { data: await this.worksService.listPublic(query) };
  }

  @Get(":slug")
  async findBySlug(@Param(new ZodValidationPipe(slugParamSchema)) params: { slug: string }): Promise<ApiSuccess<Work>> {
    return { data: await this.worksService.findPublicBySlug(params.slug) };
  }
}
