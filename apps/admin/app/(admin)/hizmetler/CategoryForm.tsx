"use client";

import { useActionState } from "react";
import { createServiceCategoryAction, type CategoryFormState } from "./actions";

const initialState: CategoryFormState = {};

export default function CategoryForm() {
  const [state, formAction, pending] = useActionState(createServiceCategoryAction, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-background p-4">
      <div>
        <label htmlFor="cat-slug">Slug</label>
        <input id="cat-slug" name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" className="w-40" />
      </div>
      <div>
        <label htmlFor="cat-name">Ad</label>
        <input id="cat-name" name="name" required className="w-56" />
      </div>
      <div>
        <label htmlFor="cat-description">Açıklama</label>
        <input id="cat-description" name="description" className="w-64" />
      </div>
      <button type="submit" disabled={pending} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-background disabled:opacity-50">
        {pending ? "Ekleniyor…" : "Kategori ekle"}
      </button>
      {state.error ? <p className="w-full text-xs text-danger">{state.error}</p> : null}
    </form>
  );
}
