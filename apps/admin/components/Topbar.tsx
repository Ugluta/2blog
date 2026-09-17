import type { AuthenticatedUser } from "@2blog/types";
import { logoutAction } from "../app/(admin)/logout-action";

export default function Topbar({ user }: { user: AuthenticatedUser }) {
  const initial = user.displayName.trim().charAt(0).toUpperCase();

  return (
    <header className="flex items-center justify-between border-b border-border bg-background px-8 py-4">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-background">{initial}</span>
        <div className="text-sm">
          <p className="font-medium">{user.displayName}</p>
          <p className="text-foreground/60">{user.roles.map((role) => role.label).join(", ")}</p>
        </div>
      </div>
      <form action={logoutAction}>
        <button type="submit" className="text-sm font-medium text-foreground/70 transition-colors hover:text-primary">
          Çıkış yap
        </button>
      </form>
    </header>
  );
}
