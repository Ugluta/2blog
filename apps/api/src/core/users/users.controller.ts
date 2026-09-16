import { Body, Controller, Get, NotFoundException, Param, Post, Query, UseGuards } from "@nestjs/common";
import { assignRoleSchema, cursorPageQuerySchema, uuidParamSchema, type AssignRoleInput } from "@2blog/validation";
import type { ApiSuccess, AuthenticatedUser, CursorPage, CursorPageQuery, User } from "@2blog/types";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { PermissionsGuard } from "../rbac/permissions.guard";
import { RequirePermission } from "../rbac/require-permission.decorator";
import { UsersService } from "./users.service";

@Controller("users")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("me")
  async me(@CurrentUser() currentUser: { sub: string }): Promise<ApiSuccess<AuthenticatedUser>> {
    const user = await this.usersService.getAuthenticatedUser(currentUser.sub);
    if (!user) throw new NotFoundException("User not found");
    return { data: user };
  }

  @Get()
  @RequirePermission("USER_VIEW")
  async list(
    @Query(new ZodValidationPipe(cursorPageQuerySchema)) query: CursorPageQuery,
  ): Promise<ApiSuccess<CursorPage<User>>> {
    return { data: await this.usersService.listUsers(query) };
  }

  @Post(":id/roles")
  @RequirePermission("USER_MANAGE")
  async assignRole(
    @Param(new ZodValidationPipe(uuidParamSchema)) params: { id: string },
    @Body(new ZodValidationPipe(assignRoleSchema)) body: AssignRoleInput,
  ): Promise<ApiSuccess<{ success: true }>> {
    await this.usersService.assignRole(params.id, body.roleId);
    return { data: { success: true } };
  }
}
