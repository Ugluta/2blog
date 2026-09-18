"use client";

import { useActionState } from "react";
import type { Tool } from "@2blog/types";
import type { ToolFormState } from "./actions";
import ContentBaseFields from "../../../components/ContentBaseFields";

interface Props {
  action: (state: ToolFormState, formData: FormData) => Promise<ToolFormState>;
  initial?: Tool;
  submitLabel: string;
}

const initialState: ToolFormState = {};

export default function ToolForm({ action, initial, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const fieldError = (name: string) => state.fieldErrors?.[name]?.[0];

  return (
    <form action={formAction} className="max-w-2xl space-y-5">
      <ContentBaseFields initial={initial} fieldError={fieldError} />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="embedUrl">Gömülü araç URL&apos;i</label>
          <input
            id="embedUrl"
            name="embedUrl"
            type="url"
            required
            placeholder="https://..."
            defaultValue={initial?.embedUrl}
            className="w-full"
          />
          <p className="mt-1 text-xs text-foreground/60">
            Bu URL, public sayfada sandboxlı bir iframe içinde &quot;Aracı Çalıştır&quot; sekmesinde açılır.
          </p>
          {fieldError("embedUrl") ? <p className="mt-1 text-xs text-danger">{fieldError("embedUrl")}</p> : null}
        </div>
        <div>
          <label htmlFor="category">Kategori</label>
          <input id="category" name="category" defaultValue={initial?.category ?? undefined} className="w-full" />
        </div>
      </div>

      <div>
        <label htmlFor="instructions">Kullanım talimatı</label>
        <textarea id="instructions" name="instructions" defaultValue={initial?.instructions ?? undefined} rows={3} className="w-full" />
      </div>

      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}

      <button type="submit" disabled={pending} className="rounded-md bg-primary px-5 py-2.5 font-medium text-background disabled:opacity-50">
        {pending ? "Kaydediliyor…" : submitLabel}
      </button>
    </form>
  );
}
