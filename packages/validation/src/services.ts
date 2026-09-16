import { z } from "zod";
import { contentBaseFieldsSchema } from "./content";

const faqEntrySchema = z.object({
  question: z.string().min(1).max(500),
  answer: z.string().min(1).max(5000),
});

export const createServiceSchema = contentBaseFieldsSchema.extend({
  categoryId: z.string().uuid().optional(),
  features: z.array(z.string().min(1).max(255)).default([]),
  process: z.array(z.string().min(1).max(500)).default([]),
  faq: z.array(faqEntrySchema).default([]),
  ctaLabel: z.string().max(255).optional(),
  ctaUrl: z.string().url().max(2048).optional(),
});

export const updateServiceSchema = createServiceSchema.omit({ slug: true }).partial();

export const serviceListQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  categoryId: z.string().uuid().optional(),
});

export const createServiceCategorySchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug must be lowercase, hyphen-separated"),
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
});

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
export type ServiceListQuery = z.infer<typeof serviceListQuerySchema>;
export type CreateServiceCategoryInput = z.infer<typeof createServiceCategorySchema>;
