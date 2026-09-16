import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { createScraperRuleSchema, type CreateScraperRuleInput } from "@2blog/validation";
import { z } from "zod";
import type { ApiSuccess, ScraperRule } from "@2blog/types";
import { ZodValidationPipe } from "../../core/common/zod-validation.pipe";
import { JwtAuthGuard } from "../../core/auth/jwt-auth.guard";
import { PermissionsGuard } from "../../core/rbac/permissions.guard";
import { RequirePermission } from "../../core/rbac/require-permission.decorator";
import { ScraperRulesService } from "./scraper-rules.service";

const listQuerySchema = z.object({ sourceId: z.string().uuid() });

@Controller("scraper/rules")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ScraperRulesController {
  constructor(private readonly rulesService: ScraperRulesService) {}

  @Get()
  @RequirePermission("SCRAPER_MANAGE")
  async list(@Query(new ZodValidationPipe(listQuerySchema)) query: { sourceId: string }): Promise<ApiSuccess<ScraperRule[]>> {
    return { data: await this.rulesService.listBySource(query.sourceId) };
  }

  @Post()
  @RequirePermission("SCRAPER_MANAGE")
  async create(@Body(new ZodValidationPipe(createScraperRuleSchema)) body: CreateScraperRuleInput): Promise<ApiSuccess<ScraperRule>> {
    return { data: await this.rulesService.create(body) };
  }
}
