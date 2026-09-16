import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { loadEnv, authEnvSchema } from "@2blog/config";
import { AccessTokenError, verifyAccessToken } from "@2blog/core-auth";
import type { FastifyRequest } from "fastify";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly env = loadEnv(authEnvSchema);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const header = request.headers["authorization"];
    const value = Array.isArray(header) ? header[0] : header;

    if (!value?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing bearer token");
    }

    try {
      const payload = verifyAccessToken(value.slice("Bearer ".length), this.env.JWT_ACCESS_SECRET);
      (request as FastifyRequest & { user: typeof payload }).user = payload;
      return true;
    } catch (error) {
      if (error instanceof AccessTokenError) {
        throw new UnauthorizedException("Invalid or expired access token");
      }
      throw error;
    }
  }
}
