import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { AccessTokenPayload } from "@2blog/types";
import type { FastifyRequest } from "fastify";

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): AccessTokenPayload => {
  const request = ctx.switchToHttp().getRequest<FastifyRequest & { user: AccessTokenPayload }>();
  return request.user;
});
