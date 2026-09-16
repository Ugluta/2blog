import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { createCategorySchema, createTagSchema, type CreateCategoryInput, type CreateTagInput } from "@2blog/validation";
import type { ApiSuccess, Category, Tag } from "@2blog/types";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../rbac/permissions.guard";
import { RequirePermission } from "../rbac/require-permission.decorator";
import { TaxonomyService } from "./taxonomy.service";

@Controller()
export class TaxonomyController {
  constructor(private readonly taxonomyService: TaxonomyService) {}

  @Get("categories")
  async listCategories(): Promise<ApiSuccess<Category[]>> {
    return { data: await this.taxonomyService.listCategories() };
  }

  @Post("categories")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission("CONTENT_EDIT")
  async createCategory(@Body(new ZodValidationPipe(createCategorySchema)) body: CreateCategoryInput): Promise<ApiSuccess<Category>> {
    return { data: await this.taxonomyService.createCategory(body.slug, body.name, body.description) };
  }

  @Get("tags")
  async listTags(): Promise<ApiSuccess<Tag[]>> {
    return { data: await this.taxonomyService.listTags() };
  }

  @Post("tags")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission("CONTENT_EDIT")
  async createTag(@Body(new ZodValidationPipe(createTagSchema)) body: CreateTagInput): Promise<ApiSuccess<Tag>> {
    return { data: await this.taxonomyService.createTag(body.slug, body.name) };
  }
}
