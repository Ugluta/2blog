"use client";

import { useActionState } from "react";
import type { Category, Content } from "@2blog/types";
import type { ContentFormState } from "./actions";

interface Props {
  action: (state: ContentFormState, formData: FormData) => Promise<ContentFormState>;
  initial?: Content;
  categories: Category[];
  submitLabel: string;
}

const initialState: ContentFormState = {};

export default function ContentForm({ action, initial, categories, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const fieldError = (name: string) => state.fieldErrors?.[name]?.[0];
  const selectedCategoryIds = new Set(initial?.categories.map((category) => category.id) ?? []);

  return (
    <form action={formAction} className="max-w-2xl space-y-5">
      <div>
        <label htmlFor="title">Başlık</label>
        <input id="title" name="title" defaultValue={initial?.title} required className="w-full" />
        {fieldError("title") ? <p className="mt-1 text-xs text-danger">{fieldError("title")}</p> : null}
      </div>

      {!initial ? (
        <div>
          <label htmlFor="slug">Slug</label>
          <input id="slug" name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" className="w-full" />
          {fieldError("slug") ? <p className="mt-1 text-xs text-danger">{fieldError("slug")}</p> : null}
        </div>
      ) : (
        <div>
          <label>Slug</label>
          <p className="text-sm text-foreground/60">{initial.slug} (değiştirilemez)</p>
        </div>
      )}

      <div>
        <label htmlFor="excerpt">Özet</label>
        <textarea id="excerpt" name="excerpt" defaultValue={initial?.excerpt ?? undefined} rows={2} className="w-full" />
      </div>

      <div>
        <label htmlFor="body">İçerik</label>
        <textarea id="body" name="body" defaultValue={initial?.body ?? undefined} rows={10} className="w-full" />
      </div>

      <div>
        <label htmlFor="coverImage">Kapak görseli URL</label>
        <input id="coverImage" name="coverImage" type="url" defaultValue={initial?.coverImage ?? undefined} className="w-full" />
      </div>

      <fieldset className="rounded-md border border-border p-4">
        <legend className="px-1 text-sm font-medium">Kategoriler</legend>
        {categories.length === 0 ? (
          <p className="text-sm text-foreground/60">Henüz kategori yok.</p>
        ) : (
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {categories.map((category) => (
              <label key={category.id} className="flex items-center gap-2 text-sm font-normal">
                <input
                  type="checkbox"
                  name="categoryIds"
                  value={category.id}
                  defaultChecked={selectedCategoryIds.has(category.id)}
                  className="w-auto"
                />
                {category.name}
              </label>
            ))}
          </div>
        )}
      </fieldset>

      <fieldset className="rounded-md border border-border p-4">
        <legend className="px-1 text-sm font-medium">SEO</legend>
        <div className="space-y-3">
          <div>
            <label htmlFor="seoTitle">SEO başlık</label>
            <input id="seoTitle" name="seoTitle" defaultValue={initial?.seoTitle ?? undefined} className="w-full" />
          </div>
          <div>
            <label htmlFor="seoDescription">SEO açıklama</label>
            <textarea id="seoDescription" name="seoDescription" defaultValue={initial?.seoDescription ?? undefined} rows={2} className="w-full" />
          </div>
          <div>
            <label htmlFor="canonicalUrl">Canonical URL</label>
            <input id="canonicalUrl" name="canonicalUrl" type="url" defaultValue={initial?.canonicalUrl ?? undefined} className="w-full" />
          </div>
          <label className="flex items-center gap-2 text-sm font-normal">
            <input type="checkbox" name="noindex" defaultChecked={initial?.noindex} className="w-auto" />
            noindex (arama motorlarından gizle)
          </label>
        </div>
      </fieldset>

      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}

      <button type="submit" disabled={pending} className="rounded-md bg-primary px-5 py-2.5 font-medium text-background disabled:opacity-50">
        {pending ? "Kaydediliyor…" : submitLabel}
      </button>
    </form>
  );
}
