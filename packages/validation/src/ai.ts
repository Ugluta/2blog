import { z } from "zod";

/**
 * Exactly one of `prompt` (free-form) or `promptKey` (+ optional
 * `variables`, rendered from the PromptRegistry) — never both, never
 * neither.
 */
export const generateTextSchema = z
  .object({
    prompt: z.string().min(1).max(8000).optional(),
    promptKey: z.string().min(1).max(100).optional(),
    variables: z.record(z.string(), z.string()).default({}),
    maxTokens: z.coerce.number().int().positive().max(4000).optional(),
    temperature: z.coerce.number().min(0).max(2).optional(),
  })
  .refine((value) => Boolean(value.prompt) !== Boolean(value.promptKey), {
    message: "Provide exactly one of prompt or promptKey",
  });

export type GenerateTextInput = z.infer<typeof generateTextSchema>;
