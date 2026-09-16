"use client";

import { useActionState } from "react";
import { createSourceAction, type FormState } from "./actions";

const initialState: FormState = {};

export default function SourceForm() {
  const [state, formAction, pending] = useActionState(createSourceAction, initialState);
  const fieldError = (name: string) => state.fieldErrors?.[name]?.[0];

  return (
    <form action={formAction} className="mb-8 max-w-2xl space-y-4 rounded-lg border border-border bg-background p-5">
      <h2 className="text-sm font-semibold">Yeni kaynak</h2>
      <div>
        <label htmlFor="name">Ad</label>
        <input id="name" name="name" required className="w-full" />
        {fieldError("name") ? <p className="mt-1 text-xs text-danger">{fieldError("name")}</p> : null}
      </div>
      <div>
        <label htmlFor="baseUrl">Site kök URL&apos;i</label>
        <input id="baseUrl" name="baseUrl" type="url" required placeholder="https://example.com" className="w-full" />
        {fieldError("baseUrl") ? <p className="mt-1 text-xs text-danger">{fieldError("baseUrl")}</p> : null}
      </div>
      <div>
        <label htmlFor="listUrl">Liste sayfası URL&apos;i</label>
        <input id="listUrl" name="listUrl" type="url" required placeholder="https://example.com/blog" className="w-full" />
        {fieldError("listUrl") ? <p className="mt-1 text-xs text-danger">{fieldError("listUrl")}</p> : null}
      </div>
      <div>
        <label htmlFor="listItemSelector">Liste öğesi CSS selector&apos;ı</label>
        <input id="listItemSelector" name="listItemSelector" required placeholder="article a.title" className="w-full" />
        {fieldError("listItemSelector") ? <p className="mt-1 text-xs text-danger">{fieldError("listItemSelector")}</p> : null}
      </div>
      <div>
        <label htmlFor="typeKey">İçerik türü (typeKey)</label>
        <input id="typeKey" name="typeKey" defaultValue="post" className="w-full" />
      </div>
      <div>
        <label htmlFor="scheduleCron">Cron ifadesi (opsiyonel — henüz otomatik çalışmıyor)</label>
        <input id="scheduleCron" name="scheduleCron" placeholder="0 * * * *" className="w-full" />
      </div>
      <label className="flex items-center gap-2 text-sm font-normal">
        <input type="checkbox" name="isEnabled" defaultChecked className="w-auto" />
        Etkin
      </label>

      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}

      <button type="submit" disabled={pending} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-background disabled:opacity-50">
        {pending ? "Kaydediliyor…" : "Kaynak ekle"}
      </button>
    </form>
  );
}
