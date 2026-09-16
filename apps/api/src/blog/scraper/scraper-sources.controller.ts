import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { createScraperSourceSchema, updateScraperSourceSchema, uuidParamSchema, type CreateScraperSourceInput, type UpdateScraperSourceInput } from "@2blog/validation";
import type { ApiSuccess, ScraperSource } from "@2blog/types";
import { ZodValidationPipe } from "../../core/common/zod-validation.pipe";
import { JwtAuthGuard } from "../../core/auth/jwt-auth.guard";
import { PermissionsGuard } from "../../core/rbac/permissions.guard";
import { RequirePermission } from "../../core/rbac/require-permission.decorator";
import { ScraperSourcesService } from "./scraper-sources.service";

@Controller("scraper/sources")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ScraperSourcesController {
  constructor(private readonly sourcesService: ScraperSourcesService) {}

  @Get()
  @RequirePermission("SCRAPER_MANAGE")
  async list(): Promise<ApiSuccess<ScraperSource[]>> {
    return { data: await this.sourcesService.list() };
  }

  @Get(":id")
  @RequirePermission("SCRAPER_MANAGE")
  async findById(@Param(new ZodValidationPipe(uuidParamSchema)) params: { id: string }): Promise<ApiSuccess<ScraperSource>> {
    return { data: await this.sourcesService.findById(params.id) };
  }

  @Post()
  @RequirePermission("SCRAPER_MANAGE")
  async create(@Body(new ZodValidationPipe(createScraperSourceSchema)) body: CreateScraperSourceInput): Promise<ApiSuccess<ScraperSource>> {
    return { data: await this.sourcesService.create(body) };
  }

  @Patch(":id")
  @RequirePermission("SCRAPER_MANAGE")
  async update(
    @Param(new ZodValidationPipe(uuidParamSchema)) params: { id: string },
    @Body(new ZodValidationPipe(updateScraperSourceSchema)) body: UpdateScraperSourceInput,
  ): Promise<ApiSuccess<ScraperSource>> {
    return { data: await this.sourcesService.update(params.id, body) };
  }
}
