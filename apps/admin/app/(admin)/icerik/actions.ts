"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createContentSchema, updateContentSchema } from "@2blog/validation";
import type { Content, ContentStatus } from "@2blog/types";
import { apiFetch, ApiError } from "../../../lib/api";

export interface ContentFormState {
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
  };
}

export async function createPostAction(_prevState: ContentFormState, formData: FormData): Promise<ContentFormState> {
  const parsed = createContentSchema.safeParse({ ...parseFormFields(formData), typeKey: "post", extraFields: {} });
  if (!parsed.success) {
    return { error: "Formu kontrol edin", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  let created: Content;
  try {
    created = await apiFetch<Content>("/content", { method: "POST", body: JSON.stringify(parsed.data) });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Beklenmeyen hata" };
  }

  revalidatePath("/icerik");
  redirect(`/icerik/${created.id}`);
}

export async function updateContentAction(id: string, _prevState: ContentFormState, formData: FormData): Promise<ContentFormState> {
  const parsed = updateContentSchema.safeParse(parseFormFields(formData));
  if (!parsed.success) {
    return { error: "Formu kontrol edin", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await apiFetch<Content>(`/content/${id}`, { method: "PATCH", body: JSON.stringify(parsed.data) });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Beklenmeyen hata" };
  }

  revalidatePath("/icerik");
  revalidatePath(`/icerik/${id}`);
  return {};
}

export async function transitionContentAction(id: string, toStatus: ContentStatus): Promise<void> {
  await apiFetch(`/content/${id}/transition`, { method: "POST", body: JSON.stringify({ toStatus }) });
  revalidatePath("/icerik");
  revalidatePath(`/icerik/${id}`);
}

export async function deleteContentAction(id: string): Promise<void> {
  await apiFetch(`/content/${id}`, { method: "DELETE" });
  revalidatePath("/icerik");
  redirect("/icerik");
}
