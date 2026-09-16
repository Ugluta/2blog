"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createProjectSchema, updateProjectSchema } from "@2blog/validation";
import type { ContentStatus, Project } from "@2blog/types";
import { apiFetch, ApiError } from "../../../lib/api";

export interface ProjectFormState {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

function splitList(value: FormDataEntryValue | null): string[] {
  return (value as string | null)?.split(",").map((item) => item.trim()).filter(Boolean) ?? [];
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
    problem: (formData.get("problem") as string) || undefined,
    solution: (formData.get("solution") as string) || undefined,
    technologies: splitList(formData.get("technologies")),
    demoUrl: (formData.get("demoUrl") as string) || undefined,
    repoUrl: (formData.get("repoUrl") as string) || undefined,
    clientName: (formData.get("clientName") as string) || undefined,
    startDate: (formData.get("startDate") as string) || undefined,
    endDate: (formData.get("endDate") as string) || undefined,
    projectStatus: (formData.get("projectStatus") as string) || undefined,
    results: (formData.get("results") as string) || undefined,
  };
}

export async function createProjectAction(_prevState: ProjectFormState, formData: FormData): Promise<ProjectFormState> {
  const parsed = createProjectSchema.safeParse(parseFormFields(formData));
  if (!parsed.success) {
    return { error: "Formu kontrol edin", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  let created: Project;
  try {
    created = await apiFetch<Project>("/projects", { method: "POST", body: JSON.stringify(parsed.data) });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Beklenmeyen hata" };
  }

  revalidatePath("/projelerimiz");
  redirect(`/projelerimiz/${created.id}`);
}

export async function updateProjectAction(id: string, _prevState: ProjectFormState, formData: FormData): Promise<ProjectFormState> {
  const parsed = updateProjectSchema.safeParse(parseFormFields(formData));
  if (!parsed.success) {
    return { error: "Formu kontrol edin", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  try {
    await apiFetch<Project>(`/projects/${id}`, { method: "PATCH", body: JSON.stringify(parsed.data) });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Beklenmeyen hata" };
  }
  revalidatePath("/projelerimiz");
  revalidatePath(`/projelerimiz/${id}`);
  return {};
}

export async function transitionProjectAction(id: string, toStatus: ContentStatus): Promise<void> {
  await apiFetch(`/projects/${id}/transition`, { method: "POST", body: JSON.stringify({ toStatus }) });
  revalidatePath("/projelerimiz");
  revalidatePath(`/projelerimiz/${id}`);
}

export async function deleteProjectAction(id: string): Promise<void> {
  await apiFetch(`/projects/${id}`, { method: "DELETE" });
  revalidatePath("/projelerimiz");
  redirect("/projelerimiz");
}
