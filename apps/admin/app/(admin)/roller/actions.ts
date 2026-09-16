"use server";

import { revalidatePath } from "next/cache";
import { createRoleSchema } from "@2blog/validation";
import type { Role } from "@2blog/types";
import { apiFetch, ApiError } from "../../../lib/api";

export interface RoleFormState {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

export async function createRoleAction(_prevState: RoleFormState, formData: FormData): Promise<RoleFormState> {
  const parsed = createRoleSchema.safeParse({
    key: formData.get("key") as string,
    label: formData.get("label") as string,
  });
  if (!parsed.success) {
    return { error: "Formu kontrol edin", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  try {
    await apiFetch<Role>("/roles", { method: "POST", body: JSON.stringify(parsed.data) });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Beklenmeyen hata" };
  }
  revalidatePath("/roller");
  return {};
}

export async function attachPermissionAction(roleId: string, formData: FormData): Promise<void> {
  const permissionKey = formData.get("permissionKey") as string;
  await apiFetch(`/roles/${roleId}/permissions`, { method: "POST", body: JSON.stringify({ permissionKey }) });
  revalidatePath("/roller");
}
