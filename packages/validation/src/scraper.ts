import { z } from "zod";
import { DATA_POOL_STATUSES } from "@2blog/types";
import { slugSchema } from "./content";

export const createScraperSourceSchema = z.object({
  name: z.string().min(1).max(255),
  baseUrl: z.string().url().max(2048),
  listUrl: z.string().url().max(2048),
  listItemSelector: z.string().min(1).max(500),
  typeKey: z.string().min(1).max(50).default("post"),
  scheduleCron: z.string().max(100).optional(),
  isEnabled: z.boolean().default(true),
});

export const updateScraperSourceSchema = createScraperSourceSchema.partial();

export const createScraperRuleSchema = z.object({
  sourceId: z.string().uuid(),
  name: z.string().min(1).max(255),
  titleSelector: z.string().min(1).max(500),
  bodySelector: z.string().min(1).max(500),
  excerptSelector: z.string().max(500).optional(),
  coverImageSelector: z.string().max(500).optional(),
  coverImageAttr: z.string().max(50).default("src"),
  isEnabled: z.boolean().default(true),
});

export const triggerCrawlSchema = z.object({
  sourceId: z.string().uuid(),
  ruleId: z.string().uuid(),
});

export const crawlJobListQuerySchema = z.object({
  sourceId: z.string().uuid().optional(),
});

export const dataPoolListQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(DATA_POOL_STATUSES).optional(),
});

export const rejectDataPoolItemSchema = z.object({
  reason: z.string().max(2000).optional(),
});

export const publishDataPoolItemSchema = z.object({
  slug: slugSchema,
});

export type CreateScraperSourceInput = z.infer<typeof createScraperSourceSchema>;
export type UpdateScraperSourceInput = z.infer<typeof updateScraperSourceSchema>;
export type CreateScraperRuleInput = z.infer<typeof createScraperRuleSchema>;
export type TriggerCrawlInput = z.infer<typeof triggerCrawlSchema>;
export type CrawlJobListQuery = z.infer<typeof crawlJobListQuerySchema>;
export type DataPoolListQuery = z.infer<typeof dataPoolListQuerySchema>;
export type RejectDataPoolItemInput = z.infer<typeof rejectDataPoolItemSchema>;
export type PublishDataPoolItemInput = z.infer<typeof publishDataPoolItemSchema>;
