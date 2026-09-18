import { Body, Controller, Delete, ForbiddenException, Get, HttpCode, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import {
  createToolSchema,
  updateToolSchema,
  toolListQuerySchema,
  transitionContentSchema,
  uuidParamSchema,
  type CreateToolInput,
  type UpdateToolInput,
  type ToolListQuery,
  type TransitionContentInput,
} from "@2blog/validation";
import { hasPermission } from "@2blog/core-rbac";
import type { AccessTokenPayload, ApiSuccess, CursorPage, Tool } from "@2blog/types";
import { ZodValidationPipe } from "../../core/common/zod-validation.pipe";
import { JwtAuthGuard } from "../../core/auth/jwt-auth.guard";
import { CurrentUser } from "../../core/auth/current-user.decorator";
import { PermissionsGuard } from "../../core/rbac/permissions.guard";
import { RequirePermission } from "../../core/rbac/require-permission.decorator";
import { ToolsService } from "./tools.service";

@Controller("tools")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ToolsController {
  constructor(private readonly toolsService: ToolsService) {}

  @Get()
  @RequirePermission("CONTENT_VIEW")
  async list(@Query(new ZodValidationPipe(toolListQuerySchema)) query: ToolListQuery): Promise<ApiSuccess<CursorPage<Tool>>> {
    return { data: await this.toolsService.list(query) };
  }

  @Get(":id")
  @RequirePermission("CONTENT_VIEW")
  async findById(@Param(new ZodValidationPipe(uuidParamSchema)) params: { id: string }): Promise<ApiSuccess<Tool>> {
    return { data: await this.toolsService.findById(params.id) };
  }

  @Post()
  @RequirePermission("CONTENT_CREATE")
  async create(
    @Body(new ZodValidationPipe(createToolSchema)) body: CreateToolInput,
    @CurrentUser() user: AccessTokenPayload,
  ): Promise<ApiSuccess<Tool>> {
    return { data: await this.toolsService.create(body, user.sub) };
  }

  @Patch(":id")
  @RequirePermission("CONTENT_EDIT")
  async update(
    @Param(new ZodValidationPipe(uuidParamSchema)) params: { id: string },
    @Body(new ZodValidationPipe(updateToolSchema)) body: UpdateToolInput,
    @CurrentUser() user: AccessTokenPayload,
  ): Promise<ApiSuccess<Tool>> {
    return { data: await this.toolsService.update(params.id, body, user.sub) };
  }

  @Post(":id/transition")
  @RequirePermission("CONTENT_EDIT")
  async transition(
    @Param(new ZodValidationPipe(uuidParamSchema)) params: { id: string },
    @Body(new ZodValidationPipe(transitionContentSchema)) body: TransitionContentInput,
    @CurrentUser() user: AccessTokenPayload,
  ): Promise<ApiSuccess<Tool>> {
    if (body.toStatus === "PUBLISHED" && !hasPermission(user.permissions, "CONTENT_PUBLISH")) {
      throw new ForbiddenException("Missing permission: CONTENT_PUBLISH");
    }
    return { data: await this.toolsService.transition(params.id, body.toStatus, user.sub) };
  }

  @Delete(":id")
  @HttpCode(200)
  @RequirePermission("CONTENT_DELETE")
  async remove(@Param(new ZodValidationPipe(uuidParamSchema)) params: { id: string }): Promise<ApiSuccess<{ success: true }>> {
    await this.toolsService.remove(params.id);
    return { data: { success: true } };
  }
}
