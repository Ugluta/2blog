"use client";

import { useActionState } from "react";
import type { Service, ServiceCategory } from "@2blog/types";
import type { ServiceFormState } from "./actions";
import ContentBaseFields from "../../../components/ContentBaseFields";

interface Props {
  action: (state: ServiceFormState, formData: FormData) => Promise<ServiceFormState>;
  initial?: Service;
  categories: ServiceCategory[];
  submitLabel: string;
}

const initialState: ServiceFormState = {};

export default function ServiceForm({ action, initial, categories, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const fieldError = (name: string) => state.fieldErrors?.[name]?.[0];

  return (
    <form action={formAction} className="max-w-2xl space-y-5">
      <ContentBaseFields initial={initial} fieldError={fieldError} />

      <div>
        <label htmlFor="categoryId">Kategori</label>
        <select id="categoryId" name="categoryId" defaultValue={initial?.category?.id ?? ""} className="w-full">
          <option value="">Kategorisiz</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="features">Özellikler (her satır bir madde)</label>
        <textarea id="features" name="features" defaultValue={initial?.features.join("\n")} rows={4} className="w-full" />
      </div>

      <div>
        <label htmlFor="process">Süreç (her satır bir adım)</label>
        <textarea id="process" name="process" defaultValue={initial?.process.join("\n")} rows={4} className="w-full" />
      </div>

      <div>
        <label htmlFor="faq">SSS (her satır &quot;Soru | Cevap&quot;)</label>
        <textarea
          id="faq"
          name="faq"
          defaultValue={initial?.faq.map((entry) => `${entry.question} | ${entry.answer}`).join("\n")}
          rows={4}
          className="w-full"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="ctaLabel">CTA metni</label>
          <input id="ctaLabel" name="ctaLabel" defaultValue={initial?.ctaLabel ?? undefined} className="w-full" />
        </div>
        <div>
          <label htmlFor="ctaUrl">CTA URL</label>
          <input id="ctaUrl" name="ctaUrl" type="url" defaultValue={initial?.ctaUrl ?? undefined} className="w-full" />
        </div>
      </div>

      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}

      <button type="submit" disabled={pending} className="rounded-md bg-primary px-5 py-2.5 font-medium text-background disabled:opacity-50">
        {pending ? "Kaydediliyor…" : submitLabel}
      </button>
    </form>
  );
}
