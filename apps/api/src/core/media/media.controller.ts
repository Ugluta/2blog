import { BadRequestException, Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import { updateMediaSchema, mediaListQuerySchema, uuidParamSchema, type UpdateMediaInput, type MediaListQuery } from "@2blog/validation";
import type { AccessTokenPayload, ApiSuccess, CursorPage, Media } from "@2blog/types";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { PermissionsGuard } from "../rbac/permissions.guard";
import { RequirePermission } from "../rbac/require-permission.decorator";
import { MediaService } from "./media.service";

@Controller("media")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get()
  @RequirePermission("MEDIA_VIEW")
  async list(@Query(new ZodValidationPipe(mediaListQuerySchema)) query: MediaListQuery): Promise<ApiSuccess<CursorPage<Media>>> {
    return { data: await this.mediaService.list(query) };
  }

  @Get(":id")
  @RequirePermission("MEDIA_VIEW")
  async findById(@Param(new ZodValidationPipe(uuidParamSchema)) params: { id: string }): Promise<ApiSuccess<Media>> {
    return { data: await this.mediaService.findById(params.id) };
  }

  @Post("upload")
  @RequirePermission("MEDIA_UPLOAD")
  async upload(@Req() req: FastifyRequest, @CurrentUser() user: AccessTokenPayload): Promise<ApiSuccess<Media>> {
    const file = await req.file();
    if (!file) {
      throw new BadRequestException("No file provided (expected a multipart/form-data field)");
    }
    const buffer = await file.toBuffer();
    if (file.file.truncated) {
      throw new BadRequestException("File exceeds the configured upload size limit");
    }
    return { data: await this.mediaService.upload(buffer, file.filename, user.sub) };
  }

  @Patch(":id")
  @RequirePermission("MEDIA_EDIT")
  async update(
    @Param(new ZodValidationPipe(uuidParamSchema)) params: { id: string },
    @Body(new ZodValidationPipe(updateMediaSchema)) body: UpdateMediaInput,
  ): Promise<ApiSuccess<Media>> {
    return { data: await this.mediaService.update(params.id, body) };
  }

  @Delete(":id")
  @HttpCode(200)
  @RequirePermission("MEDIA_DELETE")
  async remove(@Param(new ZodValidationPipe(uuidParamSchema)) params: { id: string }): Promise<ApiSuccess<{ success: true }>> {
    await this.mediaService.remove(params.id);
    return { data: { success: true } };
  }
}
