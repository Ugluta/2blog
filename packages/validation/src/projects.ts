import { z } from "zod";
import { PROJECT_STATUSES } from "@2blog/types";
import { contentBaseFieldsSchema } from "./content";

export const createProjectSchema = contentBaseFieldsSchema.extend({
  problem: z.string().max(5000).optional(),
  solution: z.string().max(5000).optional(),
  technologies: z.array(z.string().min(1).max(50)).default([]),
  demoUrl: z.string().url().max(2048).optional(),
  repoUrl: z.string().url().max(2048).optional(),
  clientName: z.string().max(255).optional(),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
  projectStatus: z.enum(PROJECT_STATUSES).default("CONCEPT"),
  results: z.string().max(5000).optional(),
});

export const updateProjectSchema = createProjectSchema.omit({ slug: true }).partial();

export const projectListQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  categoryId: z.string().uuid().optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ProjectListQuery = z.infer<typeof projectListQuerySchema>;
