import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { createServiceCategorySchema, type CreateServiceCategoryInput } from "@2blog/validation";
import type { ApiSuccess, ServiceCategory } from "@2blog/types";
import { ZodValidationPipe } from "../../core/common/zod-validation.pipe";
import { JwtAuthGuard } from "../../core/auth/jwt-auth.guard";
import { PermissionsGuard } from "../../core/rbac/permissions.guard";
import { RequirePermission } from "../../core/rbac/require-permission.decorator";
import { ServiceCategoriesService } from "./service-categories.service";

@Controller("service-categories")
export class ServiceCategoriesController {
  constructor(private readonly serviceCategoriesService: ServiceCategoriesService) {}

  @Get()
  async list(): Promise<ApiSuccess<ServiceCategory[]>> {
    return { data: await this.serviceCategoriesService.list() };
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission("CONTENT_EDIT")
  async create(
    @Body(new ZodValidationPipe(createServiceCategorySchema)) body: CreateServiceCategoryInput,
  ): Promise<ApiSuccess<ServiceCategory>> {
    return { data: await this.serviceCategoriesService.create(body.slug, body.name, body.description) };
  }
}
