"use server";

import { revalidatePath } from "next/cache";
import { createMenuItemSchema, updateMenuItemSchema } from "@2blog/validation";
import type { MenuItem } from "@2blog/types";
import { apiFetch, ApiError } from "../../../lib/api";

export interface MenuFormState {
  error?: string;
}

function parseFields(formData: FormData) {
  return {
    label: formData.get("label") as string,
    url: formData.get("url") as string,
    position: Number(formData.get("position") ?? 0),
    isVisible: formData.get("isVisible") === "on",
  };
}

export async function createMenuItemAction(_prevState: MenuFormState, formData: FormData): Promise<MenuFormState> {
  const parsed = createMenuItemSchema.safeParse(parseFields(formData));
  if (!parsed.success) {
    return { error: "Formu kontrol edin: " + JSON.stringify(parsed.error.flatten().fieldErrors) };
  }
  try {
    await apiFetch<MenuItem>("/menu", { method: "POST", body: JSON.stringify(parsed.data) });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Beklenmeyen hata" };
  }
  revalidatePath("/menu");
  return {};
}

export async function updateMenuItemAction(id: string, formData: FormData): Promise<void> {
  const parsed = updateMenuItemSchema.parse(parseFields(formData));
  await apiFetch<MenuItem>(`/menu/${id}`, { method: "PATCH", body: JSON.stringify(parsed) });
  revalidatePath("/menu");
}

export async function deleteMenuItemAction(id: string): Promise<void> {
  await apiFetch(`/menu/${id}`, { method: "DELETE" });
  revalidatePath("/menu");
}
