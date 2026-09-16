"use client";

import { useActionState } from "react";
import type { Work } from "@2blog/types";
import type { WorkFormState } from "./actions";
import ContentBaseFields from "../../../components/ContentBaseFields";

interface Props {
  action: (state: WorkFormState, formData: FormData) => Promise<WorkFormState>;
  initial?: Work;
  submitLabel: string;
}

const initialState: WorkFormState = {};

export default function WorkForm({ action, initial, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const fieldError = (name: string) => state.fieldErrors?.[name]?.[0];

  return (
    <form action={formAction} className="max-w-2xl space-y-5">
      <ContentBaseFields initial={initial} fieldError={fieldError} />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="category">Kategori</label>
          <input id="category" name="category" defaultValue={initial?.category ?? undefined} className="w-full" />
        </div>
        <div>
          <label htmlFor="workDate">Tarih</label>
          <input id="workDate" name="workDate" type="date" defaultValue={initial?.workDate ?? undefined} className="w-full" />
        </div>
      </div>

      <div>
        <label htmlFor="technologies">Teknolojiler (virgülle ayırın)</label>
        <input id="technologies" name="technologies" defaultValue={initial?.technologies.join(", ")} className="w-full" />
      </div>

      <div>
        <label htmlFor="result">Sonuç</label>
        <textarea id="result" name="result" defaultValue={initial?.result ?? undefined} rows={3} className="w-full" />
      </div>

      <div>
        <label htmlFor="links">Bağlantılar (her satır &quot;Etiket | URL&quot;)</label>
        <textarea
          id="links"
          name="links"
          defaultValue={initial?.links.map((link) => `${link.label} | ${link.url}`).join("\n")}
          rows={3}
          className="w-full"
        />
      </div>

      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}

      <button type="submit" disabled={pending} className="rounded-md bg-primary px-5 py-2.5 font-medium text-background disabled:opacity-50">
        {pending ? "Kaydediliyor…" : submitLabel}
      </button>
    </form>
  );
}
