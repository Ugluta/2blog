"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServiceSchema, updateServiceSchema, createServiceCategorySchema } from "@2blog/validation";
import type { ContentStatus, Service, ServiceCategory } from "@2blog/types";
import { apiFetch, ApiError } from "../../../lib/api";

export interface ServiceFormState {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

export interface CategoryFormState {
  error?: string;
}

function splitLines(value: FormDataEntryValue | null): string[] {
  return (value as string | null)?.split("\n").map((line) => line.trim()).filter(Boolean) ?? [];
}

/** Her satır "Soru | Cevap" formatında. */
function parseFaq(value: FormDataEntryValue | null) {
  return splitLines(value)
    .map((line) => {
      const [question, ...rest] = line.split("|");
      return { question: question?.trim() ?? "", answer: rest.join("|").trim() };
    })
    .filter((entry) => entry.question && entry.answer);
}

function parseFormFields(formData: FormData) {
  const categoryId = (formData.get("categoryId") as string) || undefined;
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
    categoryId,
    features: splitLines(formData.get("features")),
    process: splitLines(formData.get("process")),
    faq: parseFaq(formData.get("faq")),
    ctaLabel: (formData.get("ctaLabel") as string) || undefined,
    ctaUrl: (formData.get("ctaUrl") as string) || undefined,
  };
}

export async function createServiceAction(_prevState: ServiceFormState, formData: FormData): Promise<ServiceFormState> {
  const parsed = createServiceSchema.safeParse(parseFormFields(formData));
  if (!parsed.success) {
    return { error: "Formu kontrol edin", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  let created: Service;
  try {
    created = await apiFetch<Service>("/services", { method: "POST", body: JSON.stringify(parsed.data) });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Beklenmeyen hata" };
  }

  revalidatePath("/hizmetler");
  redirect(`/hizmetler/${created.id}`);
}

export async function updateServiceAction(id: string, _prevState: ServiceFormState, formData: FormData): Promise<ServiceFormState> {
  const parsed = updateServiceSchema.safeParse(parseFormFields(formData));
  if (!parsed.success) {
    return { error: "Formu kontrol edin", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  try {
    await apiFetch<Service>(`/services/${id}`, { method: "PATCH", body: JSON.stringify(parsed.data) });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Beklenmeyen hata" };
  }
  revalidatePath("/hizmetler");
  revalidatePath(`/hizmetler/${id}`);
  return {};
}

export async function transitionServiceAction(id: string, toStatus: ContentStatus): Promise<void> {
  await apiFetch(`/services/${id}/transition`, { method: "POST", body: JSON.stringify({ toStatus }) });
  revalidatePath("/hizmetler");
  revalidatePath(`/hizmetler/${id}`);
}

export async function deleteServiceAction(id: string): Promise<void> {
  await apiFetch(`/services/${id}`, { method: "DELETE" });
  revalidatePath("/hizmetler");
  redirect("/hizmetler");
}

export async function createServiceCategoryAction(_prevState: CategoryFormState, formData: FormData): Promise<CategoryFormState> {
  const parsed = createServiceCategorySchema.safeParse({
    slug: formData.get("slug") as string,
    name: formData.get("name") as string,
    description: (formData.get("description") as string) || undefined,
  });
  if (!parsed.success) {
    return { error: "Formu kontrol edin: " + JSON.stringify(parsed.error.flatten().fieldErrors) };
  }
  try {
    await apiFetch<ServiceCategory>("/service-categories", { method: "POST", body: JSON.stringify(parsed.data) });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Beklenmeyen hata" };
  }
  revalidatePath("/hizmetler");
  return {};
}
