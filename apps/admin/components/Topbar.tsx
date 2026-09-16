import type { AuthenticatedUser } from "@2blog/types";
import { logoutAction } from "../app/(admin)/logout-action";

export default function Topbar({ user }: { user: AuthenticatedUser }) {
  return (
    <header className="flex items-center justify-between border-b border-border bg-background px-8 py-4">
      <div className="text-sm text-foreground/70">
        {user.displayName} · {user.roles.map((role) => role.label).join(", ")}
      </div>
      <form action={logoutAction}>
        <button type="submit" className="text-sm text-foreground/70 hover:text-foreground">
          Çıkış yap
        </button>
      </form>
    </header>
  );
}
