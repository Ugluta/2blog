"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createToolSchema, updateToolSchema } from "@2blog/validation";
import type { ContentStatus, Tool } from "@2blog/types";
import { apiFetch, ApiError } from "../../../lib/api";

export interface ToolFormState {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

function parseFormFields(formData: FormData) {
  return {
    title: formData.get("title") as string,
    slug: formData.get("slug") as string,
    excerpt: (formData.get("excerpt") as string) || undefined,
    body: (formData.get("body") as string) || undefined,
    coverImage: (formData.get("coverImage") as string) || undefined,
    seoTitle: (formData.get("seoTitle") as string) || undefined,
    seoDescription: (formData.get("seoDescription") as string) || undefined,
    canonicalUrl: (formData.get("canonicalUrl") as string) || undefined,
    noindex: formData.get("noindex") === "on",
    embedUrl: formData.get("embedUrl") as string,
    category: (formData.get("category") as string) || undefined,
    instructions: (formData.get("instructions") as string) || undefined,
  };
}

export async function createToolAction(_prevState: ToolFormState, formData: FormData): Promise<ToolFormState> {
  const parsed = createToolSchema.safeParse(parseFormFields(formData));
  if (!parsed.success) {
    return { error: "Formu kontrol edin", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  let created: Tool;
  try {
    created = await apiFetch<Tool>("/tools", { method: "POST", body: JSON.stringify(parsed.data) });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Beklenmeyen hata" };
  }

  revalidatePath("/araclar");
  redirect(`/araclar/${created.id}`);
}

export async function updateToolAction(id: string, _prevState: ToolFormState, formData: FormData): Promise<ToolFormState> {
  const parsed = updateToolSchema.safeParse(parseFormFields(formData));
  if (!parsed.success) {
    return { error: "Formu kontrol edin", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  try {
    await apiFetch<Tool>(`/tools/${id}`, { method: "PATCH", body: JSON.stringify(parsed.data) });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Beklenmeyen hata" };
  }
  revalidatePath("/araclar");
  revalidatePath(`/araclar/${id}`);
  return {};
}

export async function transitionToolAction(id: string, toStatus: ContentStatus): Promise<void> {
  await apiFetch(`/tools/${id}/transition`, { method: "POST", body: JSON.stringify({ toStatus }) });
  revalidatePath("/araclar");
  revalidatePath(`/araclar/${id}`);
}

export async function deleteToolAction(id: string): Promise<void> {
  await apiFetch(`/tools/${id}`, { method: "DELETE" });
  revalidatePath("/araclar");
  redirect("/araclar");
}
