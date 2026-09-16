"use server";

import { revalidatePath } from "next/cache";
import { createScraperSourceSchema, createScraperRuleSchema, triggerCrawlSchema } from "@2blog/validation";
import type { ScraperSource, ScraperRule, CrawlJob } from "@2blog/types";
import { apiFetch, ApiError } from "../../../lib/api";

export interface FormState {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

export async function createSourceAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const parsed = createScraperSourceSchema.safeParse({
    name: formData.get("name") as string,
    baseUrl: formData.get("baseUrl") as string,
    listUrl: formData.get("listUrl") as string,
    listItemSelector: formData.get("listItemSelector") as string,
    typeKey: (formData.get("typeKey") as string) || "post",
    scheduleCron: (formData.get("scheduleCron") as string) || undefined,
    isEnabled: formData.get("isEnabled") === "on",
  });
  if (!parsed.success) {
    return { error: "Formu kontrol edin", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  try {
    await apiFetch<ScraperSource>("/scraper/sources", { method: "POST", body: JSON.stringify(parsed.data) });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Beklenmeyen hata" };
  }
  revalidatePath("/scraper");
  return {};
}

export async function toggleSourceEnabledAction(id: string, isEnabled: boolean): Promise<void> {
  await apiFetch(`/scraper/sources/${id}`, { method: "PATCH", body: JSON.stringify({ isEnabled }) });
  revalidatePath("/scraper");
  revalidatePath(`/scraper/${id}`);
}

export async function createRuleAction(sourceId: string, _prevState: FormState, formData: FormData): Promise<FormState> {
  const parsed = createScraperRuleSchema.safeParse({
    sourceId,
    name: formData.get("name") as string,
    titleSelector: formData.get("titleSelector") as string,
    bodySelector: formData.get("bodySelector") as string,
    excerptSelector: (formData.get("excerptSelector") as string) || undefined,
    coverImageSelector: (formData.get("coverImageSelector") as string) || undefined,
    coverImageAttr: (formData.get("coverImageAttr") as string) || "src",
    isEnabled: formData.get("isEnabled") === "on",
  });
  if (!parsed.success) {
    return { error: "Formu kontrol edin", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  try {
    await apiFetch<ScraperRule>("/scraper/rules", { method: "POST", body: JSON.stringify(parsed.data) });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Beklenmeyen hata" };
  }
  revalidatePath(`/scraper/${sourceId}`);
  return {};
}

export async function triggerCrawlAction(sourceId: string, formData: FormData): Promise<void> {
  const parsed = triggerCrawlSchema.parse({ sourceId, ruleId: formData.get("ruleId") as string });
  await apiFetch<CrawlJob>("/scraper/jobs", { method: "POST", body: JSON.stringify(parsed) });
  revalidatePath(`/scraper/${sourceId}`);
}
