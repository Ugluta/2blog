"use client";

import { useActionState } from "react";
import { generateTextAction, type GenerateFormState } from "./actions";
import { createPostAction, type ContentFormState } from "../icerik/actions";

const initialGenerateState: GenerateFormState = {};
const initialSaveState: ContentFormState = {};

function suggestSlug(topic: string): string {
  return topic
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AiDraftTool() {
  const [genState, generateFormAction, generating] = useActionState(generateTextAction, initialGenerateState);
  const [saveState, saveFormAction, saving] = useActionState(createPostAction, initialSaveState);

  return (
    <div className="max-w-2xl space-y-8">
      <form action={generateFormAction} className="space-y-4 rounded-lg border border-border bg-background p-5">
        <h2 className="text-sm font-semibold">1. Konu gir, taslak üret</h2>
        <div>
          <label htmlFor="topic">Konu</label>
          <input id="topic" name="topic" required placeholder="ör. Next.js 15'te Server Actions" className="w-full" />
        </div>
        <button type="submit" disabled={generating} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-background disabled:opacity-50">
          {generating ? "Üretiliyor…" : "Taslak üret"}
        </button>
        {genState.error ? <p className="text-sm text-danger">{genState.error}</p> : null}
        {genState.provider ? <p className="text-xs text-foreground/60">Sağlayıcı: {genState.provider}</p> : null}
      </form>

      {genState.text ? (
        <form action={saveFormAction} className="space-y-4 rounded-lg border border-border bg-background p-5">
          <h2 className="text-sm font-semibold">2. Gözden geçir, taslak olarak kaydet</h2>
          <div>
            <label htmlFor="title">Başlık</label>
            <input id="title" name="title" defaultValue={genState.topic} required className="w-full" />
            {saveState.fieldErrors?.title?.[0] ? <p className="mt-1 text-xs text-danger">{saveState.fieldErrors.title[0]}</p> : null}
          </div>
          <div>
            <label htmlFor="slug">Slug</label>
            <input
              id="slug"
              name="slug"
              defaultValue={genState.topic ? suggestSlug(genState.topic) : undefined}
              required
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              className="w-full"
            />
            {saveState.fieldErrors?.slug?.[0] ? <p className="mt-1 text-xs text-danger">{saveState.fieldErrors.slug[0]}</p> : null}
          </div>
          <div>
            <label htmlFor="body">İçerik (AI çıktısı — düzenleyebilirsiniz)</label>
            <textarea id="body" name="body" defaultValue={genState.text} rows={10} className="w-full" />
          </div>
          <p className="text-xs text-foreground/60">Kaydedilince DRAFT olarak oluşur — yayınlamak ayrı bir onay adımı (İçerik sayfası).</p>
          <button type="submit" disabled={saving} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-background disabled:opacity-50">
            {saving ? "Kaydediliyor…" : "Taslak olarak kaydet"}
          </button>
          {saveState.error ? <p className="text-sm text-danger">{saveState.error}</p> : null}
        </form>
      ) : null}
    </div>
  );
}
