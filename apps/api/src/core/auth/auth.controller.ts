import { Body, Controller, HttpCode, Post, Req } from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import { loginSchema, refreshSchema, type LoginInput, type RefreshInput } from "@2blog/validation";
import type { ApiSuccess } from "@2blog/types";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { AuthService, type AuthResult } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  async login(
    @Body(new ZodValidationPipe(loginSchema)) body: LoginInput,
    @Req() req: FastifyRequest,
  ): Promise<ApiSuccess<AuthResult>> {
    const data = await this.authService.login(body.email, body.password, {
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip,
    });
    return { data };
  }

  @Post("refresh")
  @HttpCode(200)
  async refresh(@Body(new ZodValidationPipe(refreshSchema)) body: RefreshInput): Promise<ApiSuccess<AuthResult>> {
    const data = await this.authService.refresh(body.refreshToken);
    return { data };
  }

  @Post("logout")
  @HttpCode(200)
  async logout(
    @Body(new ZodValidationPipe(refreshSchema)) body: RefreshInput,
  ): Promise<ApiSuccess<{ success: true }>> {
    await this.authService.logout(body.refreshToken);
    return { data: { success: true } };
  }
}
