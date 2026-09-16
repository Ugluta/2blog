import { z } from "zod";
import { CONTENT_STATUSES } from "@2blog/types";

export const slugSchema = z
  .string()
  .min(1)
  .max(255)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug must be lowercase, hyphen-separated");

const typeKeySchema = z
  .string()
  .min(1)
  .max(50)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "typeKey must be lowercase, hyphen-separated");

/**
 * Shared by every content type's create/update DTO (generic Content Engine
 * fields). Domain schemas for Project/Service/Work `.extend()` this instead
 * of repeating it (ARCHITECTURE.md madde 5 — the extension table only adds
 * to what's here, never replaces it).
 */
export const contentBaseFieldsSchema = z.object({
  title: z.string().min(1).max(255),
  slug: slugSchema,
  excerpt: z.string().max(1000).optional(),
  body: z.string().optional(),
  coverImage: z.string().url().max(2048).optional(),
  seoTitle: z.string().max(255).optional(),
  seoDescription: z.string().max(500).optional(),
  canonicalUrl: z.string().url().max(2048).optional(),
  noindex: z.boolean().default(false),
  categoryIds: z.array(z.string().uuid()).default([]),
  tagIds: z.array(z.string().uuid()).default([]),
});

export const createContentSchema = contentBaseFieldsSchema.extend({
  typeKey: typeKeySchema,
  extraFields: z.record(z.string(), z.unknown()).default({}),
});

/**
 * `slug` is intentionally not updatable here — changing it would silently
 * break existing links/SEO without a redirect story (that lands with SEO
 * tooling, ARCHITECTURE.md madde 16), so it's excluded rather than accepted
 * and ignored.
 */
export const updateContentSchema = createContentSchema.omit({ typeKey: true, slug: true }).partial();

export const transitionContentSchema = z.object({
  toStatus: z.enum(CONTENT_STATUSES),
});

export const contentListQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  typeKey: typeKeySchema.optional(),
  status: z.enum(CONTENT_STATUSES).optional(),
  categoryId: z.string().uuid().optional(),
});

export const publicContentListQuerySchema = contentListQuerySchema.omit({ status: true });

export type CreateContentInput = z.infer<typeof createContentSchema>;
export type UpdateContentInput = z.infer<typeof updateContentSchema>;
export type TransitionContentInput = z.infer<typeof transitionContentSchema>;
export type ContentListQuery = z.infer<typeof contentListQuerySchema>;
export type PublicContentListQuery = z.infer<typeof publicContentListQuerySchema>;
