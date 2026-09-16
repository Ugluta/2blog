"use client";

import { useActionState } from "react";
import { createRoleAction, type RoleFormState } from "./actions";

const initialState: RoleFormState = {};

export default function CreateRoleForm() {
  const [state, formAction, pending] = useActionState(createRoleAction, initialState);
  const fieldError = (name: string) => state.fieldErrors?.[name]?.[0];

  return (
    <form action={formAction} className="mb-8 flex flex-wrap items-end gap-3 rounded-lg border border-border bg-background p-4">
      <div>
        <label htmlFor="key">Anahtar (ÜST_TIRE_İLE)</label>
        <input id="key" name="key" required pattern="[A-Z][A-Z0-9_]*" className="w-48" />
        {fieldError("key") ? <p className="mt-1 text-xs text-danger">{fieldError("key")}</p> : null}
      </div>
      <div>
        <label htmlFor="label">Etiket</label>
        <input id="label" name="label" required className="w-56" />
      </div>
      <button type="submit" disabled={pending} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-background disabled:opacity-50">
        {pending ? "Oluşturuluyor…" : "Rol oluştur"}
      </button>
      {state.error ? <p className="w-full text-xs text-danger">{state.error}</p> : null}
    </form>
  );
}
