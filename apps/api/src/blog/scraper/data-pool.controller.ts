import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import {
  dataPoolListQuerySchema,
  rejectDataPoolItemSchema,
  publishDataPoolItemSchema,
  uuidParamSchema,
  type DataPoolListQuery,
  type RejectDataPoolItemInput,
  type PublishDataPoolItemInput,
} from "@2blog/validation";
import type { AccessTokenPayload, ApiSuccess, CursorPage, DataPoolItem } from "@2blog/types";
import { ZodValidationPipe } from "../../core/common/zod-validation.pipe";
import { JwtAuthGuard } from "../../core/auth/jwt-auth.guard";
import { CurrentUser } from "../../core/auth/current-user.decorator";
import { PermissionsGuard } from "../../core/rbac/permissions.guard";
import { RequirePermission } from "../../core/rbac/require-permission.decorator";
import { DataPoolService } from "./data-pool.service";

@Controller("scraper/data-pool")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DataPoolController {
  constructor(private readonly dataPoolService: DataPoolService) {}

  @Get()
  @RequirePermission("DATA_POOL_MANAGE")
  async list(@Query(new ZodValidationPipe(dataPoolListQuerySchema)) query: DataPoolListQuery): Promise<ApiSuccess<CursorPage<DataPoolItem>>> {
    return { data: await this.dataPoolService.list(query) };
  }

  @Get(":id")
  @RequirePermission("DATA_POOL_MANAGE")
  async findById(@Param(new ZodValidationPipe(uuidParamSchema)) params: { id: string }): Promise<ApiSuccess<DataPoolItem>> {
    return { data: await this.dataPoolService.findById(params.id) };
  }

  @Post(":id/approve")
  @RequirePermission("DATA_POOL_MANAGE")
  async approve(
    @Param(new ZodValidationPipe(uuidParamSchema)) params: { id: string },
    @CurrentUser() user: AccessTokenPayload,
  ): Promise<ApiSuccess<DataPoolItem>> {
    return { data: await this.dataPoolService.approve(params.id, user.sub) };
  }

  @Post(":id/reject")
  @RequirePermission("DATA_POOL_MANAGE")
  async reject(
    @Param(new ZodValidationPipe(uuidParamSchema)) params: { id: string },
    @Body(new ZodValidationPipe(rejectDataPoolItemSchema)) body: RejectDataPoolItemInput,
    @CurrentUser() user: AccessTokenPayload,
  ): Promise<ApiSuccess<DataPoolItem>> {
    return { data: await this.dataPoolService.reject(params.id, body, user.sub) };
  }

  @Post(":id/publish")
  @RequirePermission("DATA_POOL_MANAGE")
  async publish(
    @Param(new ZodValidationPipe(uuidParamSchema)) params: { id: string },
    @Body(new ZodValidationPipe(publishDataPoolItemSchema)) body: PublishDataPoolItemInput,
    @CurrentUser() user: AccessTokenPayload,
  ): Promise<ApiSuccess<DataPoolItem>> {
    return { data: await this.dataPoolService.publish(params.id, body, user.sub) };
  }
}
