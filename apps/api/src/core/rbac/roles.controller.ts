import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import {
  attachPermissionSchema,
  createRoleSchema,
  type AttachPermissionInput,
  type CreateRoleInput,
} from "@2blog/validation";
import { uuidParamSchema } from "@2blog/validation";
import type { ApiSuccess, Permission, Role } from "@2blog/types";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "./permissions.guard";
import { RequirePermission } from "./require-permission.decorator";
import { RolesService } from "./roles.service";

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get("roles")
  @RequirePermission("ROLE_VIEW")
  async list(): Promise<ApiSuccess<Role[]>> {
    return { data: await this.rolesService.listRoles() };
  }

  @Post("roles")
  @RequirePermission("ROLE_MANAGE")
  async create(@Body(new ZodValidationPipe(createRoleSchema)) body: CreateRoleInput): Promise<ApiSuccess<Role>> {
    return { data: await this.rolesService.createRole(body.key, body.label) };
  }

  @Post("roles/:id/permissions")
  @RequirePermission("ROLE_MANAGE")
  async attachPermission(
    @Param(new ZodValidationPipe(uuidParamSchema)) params: { id: string },
    @Body(new ZodValidationPipe(attachPermissionSchema)) body: AttachPermissionInput,
  ): Promise<ApiSuccess<{ success: true }>> {
    await this.rolesService.attachPermission(params.id, body.permissionKey);
    return { data: { success: true } };
  }

  @Get("permissions")
  @RequirePermission("ROLE_VIEW")
  async listPermissions(): Promise<ApiSuccess<Permission[]>> {
    return { data: await this.rolesService.listPermissions() };
  }
}
