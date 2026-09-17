"use server";

import { generateTextSchema } from "@2blog/validation";
import type { GenerateTextResponse } from "@2blog/types";
import { apiFetch, ApiError } from "../../../lib/api";

export interface GenerateFormState {
  text?: string;
  provider?: string;
  topic?: string;
  error?: string;
}

/**
 * `promptKey: "blog-post-draft"` — registered by BlogModule into
 * AiService's PromptRegistry (apps/api/src/blog/blog.module.ts), not
 * hard-coded on the Core AI endpoint itself. `apps/admin` only ever calls
 * the generic `/ai/generate/text` — it doesn't know or care that the
 * template lives in the Blog domain.
 */
export async function generateTextAction(_prevState: GenerateFormState, formData: FormData): Promise<GenerateFormState> {
  const topic = formData.get("topic") as string;
  const parsed = generateTextSchema.safeParse({ promptKey: "blog-post-draft", variables: { topic } });
  if (!parsed.success) {
    return { error: "Konu girin" };
  }

  try {
    const result = await apiFetch<GenerateTextResponse>("/ai/generate/text", { method: "POST", body: JSON.stringify(parsed.data) });
    return { text: result.text, provider: result.provider, topic };
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Beklenmeyen hata", topic };
  }
}
