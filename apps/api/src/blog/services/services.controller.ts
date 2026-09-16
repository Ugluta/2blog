import { Body, Controller, Delete, ForbiddenException, Get, HttpCode, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import {
  createServiceSchema,
  updateServiceSchema,
  serviceListQuerySchema,
  transitionContentSchema,
  uuidParamSchema,
  type CreateServiceInput,
  type UpdateServiceInput,
  type ServiceListQuery,
  type TransitionContentInput,
} from "@2blog/validation";
import { hasPermission } from "@2blog/core-rbac";
import type { AccessTokenPayload, ApiSuccess, CursorPage, Service } from "@2blog/types";
import { ZodValidationPipe } from "../../core/common/zod-validation.pipe";
import { JwtAuthGuard } from "../../core/auth/jwt-auth.guard";
import { CurrentUser } from "../../core/auth/current-user.decorator";
import { PermissionsGuard } from "../../core/rbac/permissions.guard";
import { RequirePermission } from "../../core/rbac/require-permission.decorator";
import { ServicesService } from "./services.service";

@Controller("services")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  @RequirePermission("CONTENT_VIEW")
  async list(@Query(new ZodValidationPipe(serviceListQuerySchema)) query: ServiceListQuery): Promise<ApiSuccess<CursorPage<Service>>> {
    return { data: await this.servicesService.list(query) };
  }

  @Get(":id")
  @RequirePermission("CONTENT_VIEW")
  async findById(@Param(new ZodValidationPipe(uuidParamSchema)) params: { id: string }): Promise<ApiSuccess<Service>> {
    return { data: await this.servicesService.findById(params.id) };
  }

  @Post()
  @RequirePermission("CONTENT_CREATE")
  async create(
    @Body(new ZodValidationPipe(createServiceSchema)) body: CreateServiceInput,
    @CurrentUser() user: AccessTokenPayload,
  ): Promise<ApiSuccess<Service>> {
    return { data: await this.servicesService.create(body, user.sub) };
  }

  @Patch(":id")
  @RequirePermission("CONTENT_EDIT")
  async update(
    @Param(new ZodValidationPipe(uuidParamSchema)) params: { id: string },
    @Body(new ZodValidationPipe(updateServiceSchema)) body: UpdateServiceInput,
    @CurrentUser() user: AccessTokenPayload,
  ): Promise<ApiSuccess<Service>> {
    return { data: await this.servicesService.update(params.id, body, user.sub) };
  }

  @Post(":id/transition")
  @RequirePermission("CONTENT_EDIT")
  async transition(
    @Param(new ZodValidationPipe(uuidParamSchema)) params: { id: string },
    @Body(new ZodValidationPipe(transitionContentSchema)) body: TransitionContentInput,
    @CurrentUser() user: AccessTokenPayload,
  ): Promise<ApiSuccess<Service>> {
    if (body.toStatus === "PUBLISHED" && !hasPermission(user.permissions, "CONTENT_PUBLISH")) {
      throw new ForbiddenException("Missing permission: CONTENT_PUBLISH");
    }
    return { data: await this.servicesService.transition(params.id, body.toStatus, user.sub) };
  }

  @Delete(":id")
  @HttpCode(200)
  @RequirePermission("CONTENT_DELETE")
  async remove(@Param(new ZodValidationPipe(uuidParamSchema)) params: { id: string }): Promise<ApiSuccess<{ success: true }>> {
    await this.servicesService.remove(params.id);
    return { data: { success: true } };
  }
}
