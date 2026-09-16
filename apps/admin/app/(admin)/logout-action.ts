"use server";

import { redirect } from "next/navigation";
import { clearSessionCookies, getRefreshToken } from "../../lib/session";

export async function logoutAction() {
  const refreshToken = await getRefreshToken();
  if (refreshToken) {
    const apiUrl = process.env.API_INTERNAL_URL ?? "http://localhost:4000";
    // Best-effort: even if the API call fails, the browser's cookies are
    // cleared below, so the admin is logged out of this app either way.
    await fetch(`${apiUrl}/api/v1/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    }).catch(() => {});
  }
  await clearSessionCookies();
  redirect("/login");
}
