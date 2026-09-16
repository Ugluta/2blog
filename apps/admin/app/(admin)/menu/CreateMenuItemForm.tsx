"use client";

import { useActionState } from "react";
import { createMenuItemAction, type MenuFormState } from "./actions";

const initialState: MenuFormState = {};

export default function CreateMenuItemForm() {
  const [state, formAction, pending] = useActionState(createMenuItemAction, initialState);

  return (
    <form action={formAction} className="mb-8 flex flex-wrap items-end gap-3 rounded-lg border border-border bg-background p-4">
      <div>
        <label htmlFor="new-label">Etiket</label>
        <input id="new-label" name="label" required className="w-40" />
      </div>
      <div>
        <label htmlFor="new-url">URL</label>
        <input id="new-url" name="url" required className="w-56" />
      </div>
      <div>
        <label htmlFor="new-position">Sıra</label>
        <input id="new-position" name="position" type="number" defaultValue={0} className="w-20" />
      </div>
      <label className="flex items-center gap-2 pb-2 text-sm font-normal">
        <input type="checkbox" name="isVisible" defaultChecked className="w-auto" />
        Görünür
      </label>
      <button type="submit" disabled={pending} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-background disabled:opacity-50">
        {pending ? "Ekleniyor…" : "Menü öğesi ekle"}
      </button>
      {state.error ? <p className="w-full text-xs text-danger">{state.error}</p> : null}
    </form>
  );
}
