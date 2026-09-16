import { Body, Controller, Delete, ForbiddenException, Get, HttpCode, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import {
  createProjectSchema,
  updateProjectSchema,
  projectListQuerySchema,
  type CreateProjectInput,
  type UpdateProjectInput,
  type ProjectListQuery,
} from "@2blog/validation";
import { transitionContentSchema, uuidParamSchema, type TransitionContentInput } from "@2blog/validation";
import { hasPermission } from "@2blog/core-rbac";
import type { AccessTokenPayload, ApiSuccess, CursorPage, Project } from "@2blog/types";
import { ZodValidationPipe } from "../../core/common/zod-validation.pipe";
import { JwtAuthGuard } from "../../core/auth/jwt-auth.guard";
import { CurrentUser } from "../../core/auth/current-user.decorator";
import { PermissionsGuard } from "../../core/rbac/permissions.guard";
import { RequirePermission } from "../../core/rbac/require-permission.decorator";
import { ProjectsService } from "./projects.service";

@Controller("projects")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @RequirePermission("CONTENT_VIEW")
  async list(@Query(new ZodValidationPipe(projectListQuerySchema)) query: ProjectListQuery): Promise<ApiSuccess<CursorPage<Project>>> {
    return { data: await this.projectsService.list(query) };
  }

  @Get(":id")
  @RequirePermission("CONTENT_VIEW")
  async findById(@Param(new ZodValidationPipe(uuidParamSchema)) params: { id: string }): Promise<ApiSuccess<Project>> {
    return { data: await this.projectsService.findById(params.id) };
  }

  @Post()
  @RequirePermission("CONTENT_CREATE")
  async create(
    @Body(new ZodValidationPipe(createProjectSchema)) body: CreateProjectInput,
    @CurrentUser() user: AccessTokenPayload,
  ): Promise<ApiSuccess<Project>> {
    return { data: await this.projectsService.create(body, user.sub) };
  }

  @Patch(":id")
  @RequirePermission("CONTENT_EDIT")
  async update(
    @Param(new ZodValidationPipe(uuidParamSchema)) params: { id: string },
    @Body(new ZodValidationPipe(updateProjectSchema)) body: UpdateProjectInput,
    @CurrentUser() user: AccessTokenPayload,
  ): Promise<ApiSuccess<Project>> {
    return { data: await this.projectsService.update(params.id, body, user.sub) };
  }

  @Post(":id/transition")
  @RequirePermission("CONTENT_EDIT")
  async transition(
    @Param(new ZodValidationPipe(uuidParamSchema)) params: { id: string },
    @Body(new ZodValidationPipe(transitionContentSchema)) body: TransitionContentInput,
    @CurrentUser() user: AccessTokenPayload,
  ): Promise<ApiSuccess<Project>> {
    if (body.toStatus === "PUBLISHED" && !hasPermission(user.permissions, "CONTENT_PUBLISH")) {
      throw new ForbiddenException("Missing permission: CONTENT_PUBLISH");
    }
    return { data: await this.projectsService.transition(params.id, body.toStatus, user.sub) };
  }

  @Delete(":id")
  @HttpCode(200)
  @RequirePermission("CONTENT_DELETE")
  async remove(@Param(new ZodValidationPipe(uuidParamSchema)) params: { id: string }): Promise<ApiSuccess<{ success: true }>> {
    await this.projectsService.remove(params.id);
    return { data: { success: true } };
  }
}
