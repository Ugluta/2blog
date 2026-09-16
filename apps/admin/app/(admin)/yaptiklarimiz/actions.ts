"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createWorkSchema, updateWorkSchema } from "@2blog/validation";
import type { ContentStatus, Work } from "@2blog/types";
import { apiFetch, ApiError } from "../../../lib/api";

export interface WorkFormState {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

function splitList(value: FormDataEntryValue | null): string[] {
  return (value as string | null)?.split(",").map((item) => item.trim()).filter(Boolean) ?? [];
}

/** Her satır "Etiket | URL" formatında. */
function parseLinks(value: FormDataEntryValue | null) {
  return ((value as string | null)?.split("\n") ?? [])
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, ...rest] = line.split("|");
      return { label: label?.trim() ?? "", url: rest.join("|").trim() };
    })
    .filter((entry) => entry.label && entry.url);
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
    category: (formData.get("category") as string) || undefined,
    technologies: splitList(formData.get("technologies")),
    result: (formData.get("result") as string) || undefined,
    links: parseLinks(formData.get("links")),
    workDate: (formData.get("workDate") as string) || undefined,
  };
}

export async function createWorkAction(_prevState: WorkFormState, formData: FormData): Promise<WorkFormState> {
  const parsed = createWorkSchema.safeParse(parseFormFields(formData));
  if (!parsed.success) {
    return { error: "Formu kontrol edin", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  let created: Work;
  try {
    created = await apiFetch<Work>("/works", { method: "POST", body: JSON.stringify(parsed.data) });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Beklenmeyen hata" };
  }

  revalidatePath("/yaptiklarimiz");
  redirect(`/yaptiklarimiz/${created.id}`);
}

export async function updateWorkAction(id: string, _prevState: WorkFormState, formData: FormData): Promise<WorkFormState> {
  const parsed = updateWorkSchema.safeParse(parseFormFields(formData));
  if (!parsed.success) {
    return { error: "Formu kontrol edin", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  try {
    await apiFetch<Work>(`/works/${id}`, { method: "PATCH", body: JSON.stringify(parsed.data) });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Beklenmeyen hata" };
  }
  revalidatePath("/yaptiklarimiz");
  revalidatePath(`/yaptiklarimiz/${id}`);
  return {};
}

export async function transitionWorkAction(id: string, toStatus: ContentStatus): Promise<void> {
  await apiFetch(`/works/${id}/transition`, { method: "POST", body: JSON.stringify({ toStatus }) });
  revalidatePath("/yaptiklarimiz");
  revalidatePath(`/yaptiklarimiz/${id}`);
}

export async function deleteWorkAction(id: string): Promise<void> {
  await apiFetch(`/works/${id}`, { method: "DELETE" });
  revalidatePath("/yaptiklarimiz");
  redirect("/yaptiklarimiz");
}
