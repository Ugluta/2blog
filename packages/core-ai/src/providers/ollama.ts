import type { AIProvider, GenerateTextOptions, GenerateTextResult } from "../ai-provider";
import { AIProviderError } from "../ai-provider";

export interface OllamaProviderConfig {
  baseUrl: string;
  model: string;
}

interface OllamaGenerateResponse {
  response: string;
  eval_count?: number;
}

/**
 * The only provider this repo can genuinely exercise end to end without an
 * external API key — Ollama is a local HTTP server
 * (https://github.com/ollama/ollama's REST API, non-streaming `/api/generate`).
 * Same reason ARCHITECTURE.md madde 12 lists it alongside OpenAI/Gemini:
 * self-hosted deployments with no external AI billing need an option too.
 */
export class OllamaProvider implements AIProvider {
  readonly name = "ollama";

  constructor(private readonly config: OllamaProviderConfig) {}

  async generateText(prompt: string, options?: GenerateTextOptions): Promise<GenerateTextResult> {
    let res: Response;
    try {
      res = await fetch(`${this.config.baseUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.config.model,
          prompt,
          stream: false,
          options: {
            ...(options?.temperature !== undefined && { temperature: options.temperature }),
            ...(options?.maxTokens !== undefined && { num_predict: options.maxTokens }),
          },
        }),
      });
    } catch (error) {
      throw new AIProviderError(`Ollama request failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    if (!res.ok) {
      throw new AIProviderError(`Ollama request failed: HTTP ${res.status}`);
    }

    const body = (await res.json()) as OllamaGenerateResponse;
    return { text: body.response, tokensUsed: body.eval_count };
  }
}
