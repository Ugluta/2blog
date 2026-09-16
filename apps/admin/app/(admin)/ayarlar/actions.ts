"use server";

import { revalidatePath } from "next/cache";
import { UPDATE_SETTINGS_SCHEMAS } from "@2blog/validation";
import type { SettingsCategory } from "@2blog/types";
import { apiFetch, ApiError } from "../../../lib/api";

export interface SettingsFormState {
  error?: string;
  success?: boolean;
}

function parseFields(category: SettingsCategory, formData: FormData): Record<string, unknown> {
  const str = (name: string) => (formData.get(name) as string) || undefined;

  switch (category) {
    case "general":
      return { siteName: str("siteName"), siteDescription: str("siteDescription"), contactEmail: str("contactEmail") };
    case "seo":
      return {
        defaultMetaTitle: str("defaultMetaTitle"),
        defaultMetaDescription: str("defaultMetaDescription"),
        defaultOgImage: str("defaultOgImage"),
        robotsIndexable: formData.get("robotsIndexable") === "on",
      };
    case "social":
      return {
        facebookUrl: str("facebookUrl"),
        twitterUrl: str("twitterUrl"),
        instagramUrl: str("instagramUrl"),
        linkedinUrl: str("linkedinUrl"),
        youtubeUrl: str("youtubeUrl"),
      };
  }
}

export async function updateSettingsAction(
  category: SettingsCategory,
  _prevState: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const parsed = UPDATE_SETTINGS_SCHEMAS[category].safeParse(parseFields(category, formData));
  if (!parsed.success) {
    return { error: "Formu kontrol edin: " + JSON.stringify(parsed.error.flatten().fieldErrors) };
  }
  try {
    await apiFetch(`/settings/${category}`, { method: "PATCH", body: JSON.stringify(parsed.data) });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Beklenmeyen hata" };
  }
  revalidatePath("/ayarlar");
  return { success: true };
}
