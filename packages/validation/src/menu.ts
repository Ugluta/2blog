import { z } from "zod";

export const createMenuItemSchema = z.object({
  label: z.string().min(1).max(100),
  url: z.string().min(1).max(2048),
  position: z.number().int().default(0),
  isVisible: z.boolean().default(true),
});

export const updateMenuItemSchema = createMenuItemSchema.partial();

export type CreateMenuItemInput = z.infer<typeof createMenuItemSchema>;
export type UpdateMenuItemInput = z.infer<typeof updateMenuItemSchema>;
