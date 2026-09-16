"use server";

import { revalidatePath } from "next/cache";
import { apiFetch } from "../../../lib/api";

export async function assignRoleAction(userId: string, formData: FormData): Promise<void> {
  const roleId = formData.get("roleId") as string;
  await apiFetch(`/users/${userId}/roles`, { method: "POST", body: JSON.stringify({ roleId }) });
  revalidatePath("/kullanicilar");
}
