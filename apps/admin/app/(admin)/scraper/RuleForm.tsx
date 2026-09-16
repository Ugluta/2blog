"use client";

import { useActionState } from "react";
import { createRuleAction, type FormState } from "./actions";

const initialState: FormState = {};

export default function RuleForm({ sourceId }: { sourceId: string }) {
  const boundAction = createRuleAction.bind(null, sourceId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);
  const fieldError = (name: string) => state.fieldErrors?.[name]?.[0];

  return (
    <form action={formAction} className="mb-6 max-w-2xl space-y-3 rounded-lg border border-border bg-background p-4">
      <h3 className="text-sm font-semibold">Yeni kural</h3>
      <div>
        <label htmlFor="rule-name">Ad</label>
        <input id="rule-name" name="name" required className="w-full" />
        {fieldError("name") ? <p className="mt-1 text-xs text-danger">{fieldError("name")}</p> : null}
      </div>
      <div>
        <label htmlFor="titleSelector">Başlık selector&apos;ı</label>
        <input id="titleSelector" name="titleSelector" required placeholder="h1.entry-title" className="w-full" />
        {fieldError("titleSelector") ? <p className="mt-1 text-xs text-danger">{fieldError("titleSelector")}</p> : null}
      </div>
      <div>
        <label htmlFor="bodySelector">İçerik selector&apos;ı</label>
        <input id="bodySelector" name="bodySelector" required placeholder=".entry-content" className="w-full" />
        {fieldError("bodySelector") ? <p className="mt-1 text-xs text-danger">{fieldError("bodySelector")}</p> : null}
      </div>
      <div>
        <label htmlFor="excerptSelector">Özet selector&apos;ı (opsiyonel)</label>
        <input id="excerptSelector" name="excerptSelector" placeholder=".entry-summary" className="w-full" />
      </div>
      <div>
        <label htmlFor="coverImageSelector">Kapak görseli selector&apos;ı (opsiyonel)</label>
        <input id="coverImageSelector" name="coverImageSelector" placeholder=".entry-content img" className="w-full" />
      </div>
      <div>
        <label htmlFor="coverImageAttr">Kapak görseli attribute&apos;ı</label>
        <input id="coverImageAttr" name="coverImageAttr" defaultValue="src" className="w-full" />
      </div>
      <label className="flex items-center gap-2 text-sm font-normal">
        <input type="checkbox" name="isEnabled" defaultChecked className="w-auto" />
        Etkin
      </label>

      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}

      <button type="submit" disabled={pending} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-background disabled:opacity-50">
        {pending ? "Kaydediliyor…" : "Kural ekle"}
      </button>
    </form>
  );
}
