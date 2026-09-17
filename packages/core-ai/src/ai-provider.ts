export interface GenerateTextOptions {
  maxTokens?: number;
  temperature?: number;
}

export interface GenerateTextResult {
  text: string;
  tokensUsed?: number;
}

/**
 * ARCHITECTURE.md madde 12: one interface, per-provider implementations
 * behind it — nothing above this layer (AiService, the domain admin UI)
 * knows whether it's talking to OpenAI, Gemini, or a local Ollama server.
 * Only `generateText` for this phase — image/audio generation are
 * deferred (ARCHITECTURE.md madde 7's "heavy operations run async via
 * BullMQ" applies to those, not to text, so adding them later means a
 * queue-backed path, not just another provider method).
 */
export interface AIProvider {
  readonly name: string;
  generateText(prompt: string, options?: GenerateTextOptions): Promise<GenerateTextResult>;
}

export class AIProviderError extends Error {}
