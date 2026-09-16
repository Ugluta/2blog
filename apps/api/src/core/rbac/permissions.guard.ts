import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { hasPermission } from "@2blog/core-rbac";
import type { AccessTokenPayload } from "@2blog/types";
import type { FastifyRequest } from "fastify";
import { REQUIRED_PERMISSION_KEY } from "./require-permission.decorator";

/**
 * Runs after JwtAuthGuard (which populates request.user) — a route with
 * @RequirePermission but no JwtAuthGuard is a bug, not a gap this guard
 * quietly fixes, so a missing request.user fails closed via ForbiddenException.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.get<string | undefined>(REQUIRED_PERMISSION_KEY, context.getHandler());
    if (!required) return true;

    const request = context.switchToHttp().getRequest<FastifyRequest & { user?: AccessTokenPayload }>();
    if (!request.user || !hasPermission(request.user.permissions, required)) {
      throw new ForbiddenException(`Missing permission: ${required}`);
    }
    return true;
  }
}
