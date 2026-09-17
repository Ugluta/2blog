import type { AIProvider, GenerateTextOptions, GenerateTextResult } from "../ai-provider";
import { AIProviderError } from "../ai-provider";

export interface GeminiProviderConfig {
  apiKey: string;
  model: string;
}

interface GeminiGenerateResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
  usageMetadata?: { totalTokenCount?: number };
}

/**
 * Same caveat as OpenAiProvider: written against Gemini's real
 * `generateContent` REST contract, typechecked, but not exercised against
 * the live API here — no `GEMINI_API_KEY` and no egress to
 * generativelanguage.googleapis.com in this sandbox. See docs/PHASE_LOG.md.
 */
export class GeminiProvider implements AIProvider {
  readonly name = "gemini";

  constructor(private readonly config: GeminiProviderConfig) {}

  async generateText(prompt: string, options?: GenerateTextOptions): Promise<GenerateTextResult> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.config.model}:generateContent?key=${this.config.apiKey}`;
    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            ...(options?.maxTokens !== undefined && { maxOutputTokens: options.maxTokens }),
            ...(options?.temperature !== undefined && { temperature: options.temperature }),
          },
        }),
      });
    } catch (error) {
      throw new AIProviderError(`Gemini request failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    if (!res.ok) {
      throw new AIProviderError(`Gemini request failed: HTTP ${res.status}`);
    }

    const body = (await res.json()) as GeminiGenerateResponse;
    const text = body.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
    return { text, tokensUsed: body.usageMetadata?.totalTokenCount };
  }
}
