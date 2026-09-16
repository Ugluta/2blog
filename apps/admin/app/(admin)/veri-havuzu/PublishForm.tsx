"use client";

import { useActionState } from "react";
import { publishAction, type PublishFormState } from "./actions";

const initialState: PublishFormState = {};

export default function PublishForm({ id, suggestedSlug }: { id: string; suggestedSlug: string }) {
  const boundAction = publishAction.bind(null, id);
  const [state, formAction, pending] = useActionState(boundAction, initialState);
  const fieldError = (name: string) => state.fieldErrors?.[name]?.[0];

  return (
    <form action={formAction} className="flex items-end gap-3 rounded-lg border border-border bg-background p-4">
      <div>
        <label htmlFor="slug">Slug</label>
        <input id="slug" name="slug" defaultValue={suggestedSlug} required pattern="[a-z0-9]+(-[a-z0-9]+)*" className="w-64" />
        {fieldError("slug") ? <p className="mt-1 text-xs text-danger">{fieldError("slug")}</p> : null}
      </div>
      <button type="submit" disabled={pending} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-background disabled:opacity-50">
        {pending ? "Yayınlanıyor…" : "Yayınla"}
      </button>
      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
    </form>
  );
}
