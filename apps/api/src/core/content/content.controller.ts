import { Body, Controller, Delete, ForbiddenException, Get, HttpCode, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import {
  createContentSchema,
  updateContentSchema,
  transitionContentSchema,
  contentListQuerySchema,
  uuidParamSchema,
  type CreateContentInput,
  type UpdateContentInput,
  type TransitionContentInput,
  type ContentListQuery,
} from "@2blog/validation";
import { hasPermission } from "@2blog/core-rbac";
import type { AccessTokenPayload, ApiSuccess, Content, CursorPage } from "@2blog/types";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { PermissionsGuard } from "../rbac/permissions.guard";
import { RequirePermission } from "../rbac/require-permission.decorator";
import { ContentService } from "./content.service";

@Controller("content")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Get()
  @RequirePermission("CONTENT_VIEW")
  async list(@Query(new ZodValidationPipe(contentListQuerySchema)) query: ContentListQuery): Promise<ApiSuccess<CursorPage<Content>>> {
    return { data: await this.contentService.list(query) };
  }

  @Get(":id")
  @RequirePermission("CONTENT_VIEW")
  async findById(@Param(new ZodValidationPipe(uuidParamSchema)) params: { id: string }): Promise<ApiSuccess<Content>> {
    return { data: await this.contentService.findById(params.id) };
  }

  @Post()
  @RequirePermission("CONTENT_CREATE")
  async create(
    @Body(new ZodValidationPipe(createContentSchema)) body: CreateContentInput,
    @CurrentUser() user: AccessTokenPayload,
  ): Promise<ApiSuccess<Content>> {
    return { data: await this.contentService.create(body, user.sub) };
  }

  @Patch(":id")
  @RequirePermission("CONTENT_EDIT")
  async update(
    @Param(new ZodValidationPipe(uuidParamSchema)) params: { id: string },
    @Body(new ZodValidationPipe(updateContentSchema)) body: UpdateContentInput,
    @CurrentUser() user: AccessTokenPayload,
  ): Promise<ApiSuccess<Content>> {
    return { data: await this.contentService.update(params.id, body, user.sub) };
  }

  @Post(":id/transition")
  @RequirePermission("CONTENT_EDIT")
  async transition(
    @Param(new ZodValidationPipe(uuidParamSchema)) params: { id: string },
    @Body(new ZodValidationPipe(transitionContentSchema)) body: TransitionContentInput,
    @CurrentUser() user: AccessTokenPayload,
  ): Promise<ApiSuccess<Content>> {
    if (body.toStatus === "PUBLISHED" && !hasPermission(user.permissions, "CONTENT_PUBLISH")) {
      throw new ForbiddenException("Missing permission: CONTENT_PUBLISH");
    }
    return { data: await this.contentService.transition(params.id, body.toStatus, user.sub) };
  }

  @Delete(":id")
  @HttpCode(200)
  @RequirePermission("CONTENT_DELETE")
  async remove(@Param(new ZodValidationPipe(uuidParamSchema)) params: { id: string }): Promise<ApiSuccess<{ success: true }>> {
    await this.contentService.softDelete(params.id);
    return { data: { success: true } };
  }
}
