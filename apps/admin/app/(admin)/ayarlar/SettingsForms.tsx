"use client";

import { useActionState } from "react";
import type { GeneralSettings, SeoSettings, SocialSettings } from "@2blog/types";
import { updateSettingsAction, type SettingsFormState } from "./actions";

const initialState: SettingsFormState = {};

function StatusLine({ state }: { state: SettingsFormState }) {
  if (state.error) return <p className="text-xs text-danger">{state.error}</p>;
  if (state.success) return <p className="text-xs text-primary">Kaydedildi.</p>;
  return null;
}

export function GeneralSettingsForm({ initial }: { initial: Partial<GeneralSettings> }) {
  const boundAction = updateSettingsAction.bind(null, "general");
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  return (
    <form action={formAction} className="max-w-lg space-y-4 rounded-lg border border-border bg-background p-5">
      <h2 className="text-sm font-semibold">Genel</h2>
      <div>
        <label htmlFor="siteName">Site adı</label>
        <input id="siteName" name="siteName" defaultValue={initial.siteName} required className="w-full" />
      </div>
      <div>
        <label htmlFor="siteDescription">Site açıklaması</label>
        <textarea id="siteDescription" name="siteDescription" defaultValue={initial.siteDescription} rows={2} className="w-full" />
      </div>
      <div>
        <label htmlFor="contactEmail">İletişim e-postası</label>
        <input id="contactEmail" name="contactEmail" type="email" defaultValue={initial.contactEmail} className="w-full" />
      </div>
      <button type="submit" disabled={pending} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-background disabled:opacity-50">
        {pending ? "Kaydediliyor…" : "Kaydet"}
      </button>
      <StatusLine state={state} />
    </form>
  );
}

export function SeoSettingsForm({ initial }: { initial: Partial<SeoSettings> }) {
  const boundAction = updateSettingsAction.bind(null, "seo");
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  return (
    <form action={formAction} className="max-w-lg space-y-4 rounded-lg border border-border bg-background p-5">
      <h2 className="text-sm font-semibold">SEO</h2>
      <div>
        <label htmlFor="defaultMetaTitle">Varsayılan meta başlık</label>
        <input id="defaultMetaTitle" name="defaultMetaTitle" defaultValue={initial.defaultMetaTitle} className="w-full" />
      </div>
      <div>
        <label htmlFor="defaultMetaDescription">Varsayılan meta açıklama</label>
        <textarea id="defaultMetaDescription" name="defaultMetaDescription" defaultValue={initial.defaultMetaDescription} rows={2} className="w-full" />
      </div>
      <div>
        <label htmlFor="defaultOgImage">Varsayılan OG görsel URL</label>
        <input id="defaultOgImage" name="defaultOgImage" type="url" defaultValue={initial.defaultOgImage} className="w-full" />
      </div>
      <label className="flex items-center gap-2 text-sm font-normal">
        <input type="checkbox" name="robotsIndexable" defaultChecked={initial.robotsIndexable} className="w-auto" />
        Arama motorları taransın (robotsIndexable)
      </label>
      <button type="submit" disabled={pending} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-background disabled:opacity-50">
        {pending ? "Kaydediliyor…" : "Kaydet"}
      </button>
      <StatusLine state={state} />
    </form>
  );
}

export function SocialSettingsForm({ initial }: { initial: Partial<SocialSettings> }) {
  const boundAction = updateSettingsAction.bind(null, "social");
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  return (
    <form action={formAction} className="max-w-lg space-y-4 rounded-lg border border-border bg-background p-5">
      <h2 className="text-sm font-semibold">Sosyal</h2>
      <div>
        <label htmlFor="facebookUrl">Facebook URL</label>
        <input id="facebookUrl" name="facebookUrl" type="url" defaultValue={initial.facebookUrl} className="w-full" />
      </div>
      <div>
        <label htmlFor="twitterUrl">Twitter/X URL</label>
        <input id="twitterUrl" name="twitterUrl" type="url" defaultValue={initial.twitterUrl} className="w-full" />
      </div>
      <div>
        <label htmlFor="instagramUrl">Instagram URL</label>
        <input id="instagramUrl" name="instagramUrl" type="url" defaultValue={initial.instagramUrl} className="w-full" />
      </div>
      <div>
        <label htmlFor="linkedinUrl">LinkedIn URL</label>
        <input id="linkedinUrl" name="linkedinUrl" type="url" defaultValue={initial.linkedinUrl} className="w-full" />
      </div>
      <div>
        <label htmlFor="youtubeUrl">YouTube URL</label>
        <input id="youtubeUrl" name="youtubeUrl" type="url" defaultValue={initial.youtubeUrl} className="w-full" />
      </div>
      <button type="submit" disabled={pending} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-background disabled:opacity-50">
        {pending ? "Kaydediliyor…" : "Kaydet"}
      </button>
      <StatusLine state={state} />
    </form>
  );
}
