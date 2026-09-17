import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { generateTextSchema, type GenerateTextInput } from "@2blog/validation";
import type { AccessTokenPayload, ApiSuccess, GenerateTextResponse } from "@2blog/types";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { PermissionsGuard } from "../rbac/permissions.guard";
import { RequirePermission } from "../rbac/require-permission.decorator";
import { AiService } from "./ai.service";

@Controller("ai")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post("generate/text")
  @RequirePermission("AI_USE")
  async generateText(
    @Body(new ZodValidationPipe(generateTextSchema)) body: GenerateTextInput,
    @CurrentUser() user: AccessTokenPayload,
  ): Promise<ApiSuccess<GenerateTextResponse>> {
    const request = await this.aiService.generateText(body, user.sub);
    return {
      data: {
        text: request.resultText ?? "",
        tokensUsed: request.tokensUsed,
        provider: request.provider,
        requestId: request.id,
      },
    };
  }
}
