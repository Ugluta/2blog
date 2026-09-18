import { Controller, Get, Param, Query } from "@nestjs/common";
import { toolListQuerySchema, slugParamSchema, type ToolListQuery } from "@2blog/validation";
import type { ApiSuccess, CursorPage, Tool } from "@2blog/types";
import { ZodValidationPipe } from "../../core/common/zod-validation.pipe";
import { ToolsService } from "./tools.service";

@Controller("tools/public")
export class ToolsPublicController {
  constructor(private readonly toolsService: ToolsService) {}

  @Get()
  async list(@Query(new ZodValidationPipe(toolListQuerySchema)) query: ToolListQuery): Promise<ApiSuccess<CursorPage<Tool>>> {
    return { data: await this.toolsService.listPublic(query) };
  }

  @Get(":slug")
  async findBySlug(@Param(new ZodValidationPipe(slugParamSchema)) params: { slug: string }): Promise<ApiSuccess<Tool>> {
    return { data: await this.toolsService.findPublicBySlug(params.slug) };
  }
}
