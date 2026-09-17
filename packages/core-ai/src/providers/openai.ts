import type { AIProvider, GenerateTextOptions, GenerateTextResult } from "../ai-provider";
import { AIProviderError } from "../ai-provider";

export interface OpenAiProviderConfig {
  apiKey: string;
  model: string;
}

interface OpenAiChatResponse {
  choices?: { message?: { content?: string } }[];
  usage?: { total_tokens?: number };
}

/**
 * Written and typechecked against OpenAI's real Chat Completions contract,
 * but never exercised against the live API in this repo's dev/test
 * environment — no `OPENAI_API_KEY` is available here, and this sandbox's
 * network egress doesn't reach api.openai.com either. `AI_PROVIDER=ollama`
 * (the default) is what's actually been run end to end; see
 * docs/PHASE_LOG.md.
 */
export class OpenAiProvider implements AIProvider {
  readonly name = "openai";

  constructor(private readonly config: OpenAiProviderConfig) {}

  async generateText(prompt: string, options?: GenerateTextOptions): Promise<GenerateTextResult> {
    let res: Response;
    try {
      res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.config.apiKey}` },
        body: JSON.stringify({
          model: this.config.model,
          messages: [{ role: "user", content: prompt }],
          ...(options?.maxTokens !== undefined && { max_tokens: options.maxTokens }),
          ...(options?.temperature !== undefined && { temperature: options.temperature }),
        }),
      });
    } catch (error) {
      throw new AIProviderError(`OpenAI request failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    if (!res.ok) {
      throw new AIProviderError(`OpenAI request failed: HTTP ${res.status}`);
    }

    const body = (await res.json()) as OpenAiChatResponse;
    const text = body.choices?.[0]?.message?.content ?? "";
    return { text, tokensUsed: body.usage?.total_tokens };
  }
}
