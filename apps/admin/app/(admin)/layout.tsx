import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import type { AuthenticatedUser } from "@2blog/types";
import { apiFetch, UnauthenticatedError } from "../../lib/api";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  let user: AuthenticatedUser;
  try {
    user = await apiFetch<AuthenticatedUser>("/users/me");
  } catch (error) {
    if (error instanceof UnauthenticatedError) redirect("/login");
    throw error;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar permissions={user.permissions} />
      <div className="flex-1">
        <Topbar user={user} />
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
