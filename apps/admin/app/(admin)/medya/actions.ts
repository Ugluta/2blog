"use server";

import { revalidatePath } from "next/cache";
import type { Media } from "@2blog/types";
import { apiFetch, apiFetchForm } from "../../../lib/api";

export async function uploadMediaAction(formData: FormData): Promise<void> {
  await apiFetchForm<Media>("/media/upload", formData);
  revalidatePath("/medya");
}

export async function deleteMediaAction(id: string): Promise<void> {
  await apiFetch(`/media/${id}`, { method: "DELETE" });
  revalidatePath("/medya");
}
