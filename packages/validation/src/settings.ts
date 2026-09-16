import { z } from "zod";
import { SETTINGS_CATEGORIES } from "@2blog/types";

export const settingsCategoryParamSchema = z.object({
  category: z.enum(SETTINGS_CATEGORIES),
});

const generalSettingsSchema = z.object({
  siteName: z.string().min(1).max(255),
  siteDescription: z.string().max(1000).optional(),
  contactEmail: z.string().email().optional(),
});

const seoSettingsSchema = z.object({
  defaultMetaTitle: z.string().max(255).optional(),
  defaultMetaDescription: z.string().max(500).optional(),
  defaultOgImage: z.string().url().optional(),
  robotsIndexable: z.boolean().default(true),
});

const socialSettingsSchema = z.object({
  facebookUrl: z.string().url().optional(),
  twitterUrl: z.string().url().optional(),
  instagramUrl: z.string().url().optional(),
  linkedinUrl: z.string().url().optional(),
  youtubeUrl: z.string().url().optional(),
});

/**
 * One full schema per category (used to validate seeded defaults) and one
 * partial variant (used to validate a PATCH, which merges onto whatever is
 * already stored — ARCHITECTURE.md madde 15's "kategori bazlı GET/PATCH").
 */
export const SETTINGS_SCHEMAS = {
  general: generalSettingsSchema,
  seo: seoSettingsSchema,
  social: socialSettingsSchema,
} as const;

export const UPDATE_SETTINGS_SCHEMAS = {
  general: generalSettingsSchema.partial(),
  seo: seoSettingsSchema.partial(),
  social: socialSettingsSchema.partial(),
} as const;
