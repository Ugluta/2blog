import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { createMenuItemSchema, updateMenuItemSchema, uuidParamSchema, type CreateMenuItemInput, type UpdateMenuItemInput } from "@2blog/validation";
import type { ApiSuccess, MenuItem } from "@2blog/types";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../rbac/permissions.guard";
import { RequirePermission } from "../rbac/require-permission.decorator";
import { MenuService } from "./menu.service";

/**
 * `@RequirePermission` is a method-level decorator here (not class-level —
 * PermissionsGuard only reads metadata off `context.getHandler()`, so a
 * class-level `@RequirePermission` would silently never be seen and every
 * route would pass unguarded). Every route needs it individually.
 */
@Controller("menu")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get()
  @RequirePermission("SETTINGS_MANAGE")
  async list(): Promise<ApiSuccess<MenuItem[]>> {
    return { data: await this.menuService.listAll() };
  }

  @Post()
  @RequirePermission("SETTINGS_MANAGE")
  async create(@Body(new ZodValidationPipe(createMenuItemSchema)) body: CreateMenuItemInput): Promise<ApiSuccess<MenuItem>> {
    return { data: await this.menuService.create(body) };
  }

  @Patch(":id")
  @RequirePermission("SETTINGS_MANAGE")
  async update(
    @Param(new ZodValidationPipe(uuidParamSchema)) params: { id: string },
    @Body(new ZodValidationPipe(updateMenuItemSchema)) body: UpdateMenuItemInput,
  ): Promise<ApiSuccess<MenuItem>> {
    return { data: await this.menuService.update(params.id, body) };
  }

  @Delete(":id")
  @HttpCode(200)
  @RequirePermission("SETTINGS_MANAGE")
  async remove(@Param(new ZodValidationPipe(uuidParamSchema)) params: { id: string }): Promise<ApiSuccess<{ success: true }>> {
    await this.menuService.remove(params.id);
    return { data: { success: true } };
  }
}
