import { Body, Controller, Delete, ForbiddenException, Get, HttpCode, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import {
  createWorkSchema,
  updateWorkSchema,
  workListQuerySchema,
  transitionContentSchema,
  uuidParamSchema,
  type CreateWorkInput,
  type UpdateWorkInput,
  type WorkListQuery,
  type TransitionContentInput,
} from "@2blog/validation";
import { hasPermission } from "@2blog/core-rbac";
import type { AccessTokenPayload, ApiSuccess, CursorPage, Work } from "@2blog/types";
import { ZodValidationPipe } from "../../core/common/zod-validation.pipe";
import { JwtAuthGuard } from "../../core/auth/jwt-auth.guard";
import { CurrentUser } from "../../core/auth/current-user.decorator";
import { PermissionsGuard } from "../../core/rbac/permissions.guard";
import { RequirePermission } from "../../core/rbac/require-permission.decorator";
import { WorksService } from "./works.service";

@Controller("works")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class WorksController {
  constructor(private readonly worksService: WorksService) {}

  @Get()
  @RequirePermission("CONTENT_VIEW")
  async list(@Query(new ZodValidationPipe(workListQuerySchema)) query: WorkListQuery): Promise<ApiSuccess<CursorPage<Work>>> {
    return { data: await this.worksService.list(query) };
  }

  @Get(":id")
  @RequirePermission("CONTENT_VIEW")
  async findById(@Param(new ZodValidationPipe(uuidParamSchema)) params: { id: string }): Promise<ApiSuccess<Work>> {
    return { data: await this.worksService.findById(params.id) };
  }

  @Post()
  @RequirePermission("CONTENT_CREATE")
  async create(
    @Body(new ZodValidationPipe(createWorkSchema)) body: CreateWorkInput,
    @CurrentUser() user: AccessTokenPayload,
  ): Promise<ApiSuccess<Work>> {
    return { data: await this.worksService.create(body, user.sub) };
  }

  @Patch(":id")
  @RequirePermission("CONTENT_EDIT")
  async update(
    @Param(new ZodValidationPipe(uuidParamSchema)) params: { id: string },
    @Body(new ZodValidationPipe(updateWorkSchema)) body: UpdateWorkInput,
    @CurrentUser() user: AccessTokenPayload,
  ): Promise<ApiSuccess<Work>> {
    return { data: await this.worksService.update(params.id, body, user.sub) };
  }

  @Post(":id/transition")
  @RequirePermission("CONTENT_EDIT")
  async transition(
    @Param(new ZodValidationPipe(uuidParamSchema)) params: { id: string },
    @Body(new ZodValidationPipe(transitionContentSchema)) body: TransitionContentInput,
    @CurrentUser() user: AccessTokenPayload,
  ): Promise<ApiSuccess<Work>> {
    if (body.toStatus === "PUBLISHED" && !hasPermission(user.permissions, "CONTENT_PUBLISH")) {
      throw new ForbiddenException("Missing permission: CONTENT_PUBLISH");
    }
    return { data: await this.worksService.transition(params.id, body.toStatus, user.sub) };
  }

  @Delete(":id")
  @HttpCode(200)
  @RequirePermission("CONTENT_DELETE")
  async remove(@Param(new ZodValidationPipe(uuidParamSchema)) params: { id: string }): Promise<ApiSuccess<{ success: true }>> {
    await this.worksService.remove(params.id);
    return { data: { success: true } };
  }
}
