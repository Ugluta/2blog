"use client";

import { useActionState } from "react";
import { loginAction, type LoginActionState } from "./actions";

const initialState: LoginActionState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted px-4">
      <form action={formAction} className="w-full max-w-sm rounded-lg border border-border bg-background p-8 shadow-sm">
        <h1 className="mb-6 text-xl font-semibold">2blog Admin</h1>
        <div className="mb-4">
          <label htmlFor="email">E-posta</label>
          <input id="email" name="email" type="email" required autoComplete="email" className="w-full" />
        </div>
        <div className="mb-6">
          <label htmlFor="password">Şifre</label>
          <input id="password" name="password" type="password" required autoComplete="current-password" className="w-full" />
        </div>
        {state.error ? <p className="mb-4 text-sm text-danger">{state.error}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-primary px-4 py-2 font-medium text-background disabled:opacity-50"
        >
          {pending ? "Giriş yapılıyor…" : "Giriş yap"}
        </button>
      </form>
    </main>
  );
}
