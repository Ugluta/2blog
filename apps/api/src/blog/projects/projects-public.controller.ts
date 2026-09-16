import { Controller, Get, Param, Query } from "@nestjs/common";
import { projectListQuerySchema, slugParamSchema, type ProjectListQuery } from "@2blog/validation";
import type { ApiSuccess, CursorPage, Project } from "@2blog/types";
import { ZodValidationPipe } from "../../core/common/zod-validation.pipe";
import { ProjectsService } from "./projects.service";

/** No guard — same pattern as PublicContentController; only ever returns PUBLISHED projects. */
@Controller("projects/public")
export class ProjectsPublicController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  async list(@Query(new ZodValidationPipe(projectListQuerySchema)) query: ProjectListQuery): Promise<ApiSuccess<CursorPage<Project>>> {
    return { data: await this.projectsService.listPublic(query) };
  }

  @Get(":slug")
  async findBySlug(@Param(new ZodValidationPipe(slugParamSchema)) params: { slug: string }): Promise<ApiSuccess<Project>> {
    return { data: await this.projectsService.findPublicBySlug(params.slug) };
  }
}
