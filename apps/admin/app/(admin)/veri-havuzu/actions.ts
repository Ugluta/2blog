"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { publishDataPoolItemSchema } from "@2blog/validation";
import type { DataPoolItem } from "@2blog/types";
import { apiFetch, ApiError } from "../../../lib/api";

export interface PublishFormState {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

export async function approveAction(id: string): Promise<void> {
  await apiFetch(`/scraper/data-pool/${id}/approve`, { method: "POST", body: JSON.stringify({}) });
  revalidatePath("/veri-havuzu");
  revalidatePath(`/veri-havuzu/${id}`);
}

export async function rejectAction(id: string, formData: FormData): Promise<void> {
  const reason = (formData.get("reason") as string) || undefined;
  await apiFetch(`/scraper/data-pool/${id}/reject`, { method: "POST", body: JSON.stringify({ reason }) });
  revalidatePath("/veri-havuzu");
  revalidatePath(`/veri-havuzu/${id}`);
}

export async function publishAction(id: string, _prevState: PublishFormState, formData: FormData): Promise<PublishFormState> {
  const parsed = publishDataPoolItemSchema.safeParse({ slug: formData.get("slug") as string });
  if (!parsed.success) {
    return { error: "Formu kontrol edin", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  let published: DataPoolItem;
  try {
    published = await apiFetch<DataPoolItem>(`/scraper/data-pool/${id}/publish`, { method: "POST", body: JSON.stringify(parsed.data) });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Beklenmeyen hata" };
  }
  revalidatePath("/veri-havuzu");
  redirect(`/icerik/${published.contentId}`);
}
