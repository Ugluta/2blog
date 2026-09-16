import { z } from "zod";

/**
 * Shared building blocks. Both Core and every domain module reuse these
 * instead of redefining "what is a UUID param" or "what is a page query"
 * per endpoint.
 */

export const uuidParamSchema = z.object({
  id: z.string().uuid(),
});

export const slugParamSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug must be lowercase, hyphen-separated"),
});

export const cursorPageQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const emailSchema = z.string().email().max(255);

export const passwordSchema = z
  .string()
  .min(12, "password must be at least 12 characters")
  .max(256);
