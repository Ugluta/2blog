import { Body, Controller, Get, Param, Patch, UseGuards } from "@nestjs/common";
import { settingsCategoryParamSchema } from "@2blog/validation";
import type { AccessTokenPayload, ApiSuccess } from "@2blog/types";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { PermissionsGuard } from "../rbac/permissions.guard";
import { RequirePermission } from "../rbac/require-permission.decorator";
import { SettingsService } from "./settings.service";

interface CategoryParam {
  category: "general" | "seo" | "social";
}

/**
 * Reads are public — nothing stored here is sensitive (site name, SEO
 * defaults, social profile links); apps/web needs these unauthenticated for
 * SSR (madde 2/3). Only PATCH is gated.
 */
@Controller("settings")
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  async getAll(): Promise<ApiSuccess<Record<string, Record<string, unknown>>>> {
    return { data: await this.settingsService.getAll() };
  }

  @Get(":category")
  async getCategory(
    @Param(new ZodValidationPipe(settingsCategoryParamSchema)) params: CategoryParam,
  ): Promise<ApiSuccess<Record<string, unknown>>> {
    return { data: await this.settingsService.getCategory(params.category) };
  }

  @Patch(":category")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission("SETTINGS_MANAGE")
  async updateCategory(
    @Param(new ZodValidationPipe(settingsCategoryParamSchema)) params: CategoryParam,
    @Body() body: unknown,
    @CurrentUser() user: AccessTokenPayload,
  ): Promise<ApiSuccess<Record<string, unknown>>> {
    return { data: await this.settingsService.updateCategory(params.category, body, user.sub) };
  }
}
