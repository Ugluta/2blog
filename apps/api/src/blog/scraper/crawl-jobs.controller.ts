import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { triggerCrawlSchema, crawlJobListQuerySchema, type TriggerCrawlInput, type CrawlJobListQuery } from "@2blog/validation";
import type { ApiSuccess, AccessTokenPayload, CrawlJob } from "@2blog/types";
import { ZodValidationPipe } from "../../core/common/zod-validation.pipe";
import { JwtAuthGuard } from "../../core/auth/jwt-auth.guard";
import { CurrentUser } from "../../core/auth/current-user.decorator";
import { PermissionsGuard } from "../../core/rbac/permissions.guard";
import { RequirePermission } from "../../core/rbac/require-permission.decorator";
import { CrawlJobsService } from "./crawl-jobs.service";

@Controller("scraper/jobs")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CrawlJobsController {
  constructor(private readonly crawlJobsService: CrawlJobsService) {}

  @Get()
  @RequirePermission("SCRAPER_MANAGE")
  async list(@Query(new ZodValidationPipe(crawlJobListQuerySchema)) query: CrawlJobListQuery): Promise<ApiSuccess<CrawlJob[]>> {
    return { data: await this.crawlJobsService.list(query) };
  }

  @Post()
  @RequirePermission("SCRAPER_MANAGE")
  async trigger(
    @Body(new ZodValidationPipe(triggerCrawlSchema)) body: TriggerCrawlInput,
    @CurrentUser() user: AccessTokenPayload,
  ): Promise<ApiSuccess<CrawlJob>> {
    return { data: await this.crawlJobsService.trigger(body, user.sub) };
  }
}
