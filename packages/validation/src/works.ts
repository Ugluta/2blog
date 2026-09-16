import { z } from "zod";
import { contentBaseFieldsSchema } from "./content";

const linkSchema = z.object({
  label: z.string().min(1).max(255),
  url: z.string().url().max(2048),
});

export const createWorkSchema = contentBaseFieldsSchema.extend({
  category: z.string().max(255).optional(),
  technologies: z.array(z.string().min(1).max(50)).default([]),
  result: z.string().max(5000).optional(),
  links: z.array(linkSchema).default([]),
  workDate: z.string().date().optional(),
});

export const updateWorkSchema = createWorkSchema.omit({ slug: true }).partial();

export const workListQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateWorkInput = z.infer<typeof createWorkSchema>;
export type UpdateWorkInput = z.infer<typeof updateWorkSchema>;
export type WorkListQuery = z.infer<typeof workListQuerySchema>;
