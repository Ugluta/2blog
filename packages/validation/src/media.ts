import { z } from "zod";

export const updateMediaSchema = z.object({
  altText: z.string().max(500).optional(),
  caption: z.string().max(1000).optional(),
});

export const mediaListQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  kind: z.enum(["IMAGE", "VIDEO", "AUDIO", "DOCUMENT"]).optional(),
});

export type UpdateMediaInput = z.infer<typeof updateMediaSchema>;
export type MediaListQuery = z.infer<typeof mediaListQuerySchema>;
