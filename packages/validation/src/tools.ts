import { z } from "zod";
import { contentBaseFieldsSchema } from "./content";

export const createToolSchema = contentBaseFieldsSchema.extend({
  embedUrl: z.string().url().max(2048),
  category: z.string().max(255).optional(),
  instructions: z.string().max(5000).optional(),
});

export const updateToolSchema = createToolSchema.omit({ slug: true }).partial();

export const toolListQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateToolInput = z.infer<typeof createToolSchema>;
export type UpdateToolInput = z.infer<typeof updateToolSchema>;
export type ToolListQuery = z.infer<typeof toolListQuerySchema>;
