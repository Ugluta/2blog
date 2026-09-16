import { z } from "zod";

export const createRoleSchema = z.object({
  key: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[A-Z][A-Z0-9_]*$/, "role key must be UPPER_SNAKE_CASE"),
  label: z.string().min(1).max(255),
});

export const attachPermissionSchema = z.object({
  permissionKey: z.string().min(1).max(150),
});

export const assignRoleSchema = z.object({
  roleId: z.string().uuid(),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type AttachPermissionInput = z.infer<typeof attachPermissionSchema>;
export type AssignRoleInput = z.infer<typeof assignRoleSchema>;
