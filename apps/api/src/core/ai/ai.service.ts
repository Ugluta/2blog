import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { loadEnv, aiEnvSchema } from "@2blog/config";
import {
  AIProviderError,
  OllamaProvider,
  OpenAiProvider,
  GeminiProvider,
  PromptRegistry,
  type AIProvider,
} from "@2blog/core-ai";
import { schema, type Database } from "@2blog/core-database";
import type { GenerateTextInput } from "@2blog/validation";
import type { AiRequest } from "@2blog/types";
import { DATABASE_CONNECTION } from "../database/database.constants";

type RequestRow = typeof schema.aiRequests.$inferSelect;

/**
 * One provider, chosen once at startup from `AI_PROVIDER` — never per
 * request. Domain modules register their own prompts into the shared
 * registry the same way BlogModule registers content types
 * (ARCHITECTURE.md madde 12).
 */
@Injectable()
export class AiService {
  private readonly provider: AIProvider;
  readonly promptRegistry = new PromptRegistry();

  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {
    const env = loadEnv(aiEnvSchema);
    switch (env.AI_PROVIDER) {
      case "openai":
        this.provider = new OpenAiProvider({ apiKey: env.OPENAI_API_KEY!, model: env.AI_OPENAI_MODEL });
        break;
      case "gemini":
        this.provider = new GeminiProvider({ apiKey: env.GEMINI_API_KEY!, model: env.AI_GEMINI_MODEL });
        break;
      case "ollama":
      default:
        this.provider = new OllamaProvider({ baseUrl: env.AI_OLLAMA_BASE_URL, model: env.AI_OLLAMA_MODEL });
        break;
    }
  }

  async generateText(input: GenerateTextInput, userId: string): Promise<AiRequest> {
    const prompt = input.promptKey ? this.renderPromptOrThrow(input.promptKey, input.variables) : input.prompt!;

    try {
      const result = await this.provider.generateText(prompt, { maxTokens: input.maxTokens, temperature: input.temperature });
      const [row] = await this.db
        .insert(schema.aiRequests)
        .values({
          userId,
          provider: this.provider.name,
          promptKey: input.promptKey,
          prompt,
          resultText: result.text,
          tokensUsed: result.tokensUsed,
          status: "SUCCESS",
        })
        .returning();
      return this.toApiShape(row!);
    } catch (error) {
      const message = error instanceof AIProviderError ? error.message : error instanceof Error ? error.message : String(error);
      await this.db.insert(schema.aiRequests).values({
        userId,
        provider: this.provider.name,
        promptKey: input.promptKey,
        prompt,
        status: "FAILED",
        errorMessage: message,
      });
      throw new BadRequestException(`AI generation failed: ${message}`);
    }
  }

  private renderPromptOrThrow(promptKey: string, variables: Record<string, string>): string {
    try {
      return this.promptRegistry.render(promptKey, variables);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : "Invalid promptKey");
    }
  }

  private toApiShape(row: RequestRow): AiRequest {
    return {
      id: row.id,
      userId: row.userId,
      provider: row.provider,
      promptKey: row.promptKey,
      prompt: row.prompt,
      resultText: row.resultText,
      resultRef: row.resultRef,
      tokensUsed: row.tokensUsed,
      status: row.status,
      errorMessage: row.errorMessage,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
