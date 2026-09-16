"use server";

import { redirect } from "next/navigation";
import { loginSchema } from "@2blog/validation";
import { setSessionCookies } from "../../lib/session";

export interface LoginActionState {
  error?: string;
}

export async function loginAction(_prevState: LoginActionState, formData: FormData): Promise<LoginActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "E-posta ve şifre gerekli" };
  }

  const apiUrl = process.env.API_INTERNAL_URL ?? "http://localhost:4000";
  const res = await fetch(`${apiUrl}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(parsed.data),
  });

  if (!res.ok) {
    return { error: "E-posta veya şifre hatalı" };
  }

  const body = (await res.json()) as { data: { accessToken: string; refreshToken: string } };
  await setSessionCookies(body.data.accessToken, body.data.refreshToken);
  redirect("/");
}
