import type { CursorPage, Role, User } from "@2blog/types";
import { apiFetch } from "../../../lib/api";
import { assignRoleAction } from "./actions";

export default async function UsersListPage() {
  const [page, roles] = await Promise.all([
    apiFetch<CursorPage<User>>("/users?limit=100"),
    apiFetch<Role[]>("/roles"),
  ]);

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Kullanıcılar</h1>
      <p className="mb-6 text-sm text-foreground/60">
        Not: API şu an kullanıcı listesinde mevcut rolleri döndürmüyor (yalnızca kendi profilin, <code>/users/me</code>,
        rollerini gösterir) — bu yüzden aşağıda sadece yeni rol atama formu var, mevcut roller görünmüyor.
      </p>

      {roles.length === 0 ? <p className="mb-4 text-sm text-danger">Henüz hiç rol yok — önce Roller sayfasından rol oluşturun.</p> : null}

      <table className="w-full overflow-hidden rounded-lg border border-border bg-background text-sm">
        <thead className="bg-muted text-left text-xs uppercase tracking-wide text-foreground/60">
          <tr>
            <th className="px-4 py-3">E-posta</th>
            <th className="px-4 py-3">Ad</th>
            <th className="px-4 py-3">Kayıt</th>
            <th className="px-4 py-3">Rol ata</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {page.items.map((user) => (
            <tr key={user.id} className="hover:bg-muted/50">
              <td className="px-4 py-3">{user.email}</td>
              <td className="px-4 py-3">{user.displayName}</td>
              <td className="px-4 py-3 text-foreground/60">{new Date(user.createdAt).toLocaleString("tr-TR")}</td>
              <td className="px-4 py-3">
                <form action={assignRoleAction.bind(null, user.id)} className="flex items-center gap-2">
                  <select name="roleId" required className="w-auto text-xs" disabled={roles.length === 0}>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                  <button type="submit" disabled={roles.length === 0} className="rounded-md border border-border px-2 py-1 text-xs hover:border-primary disabled:opacity-50">
                    Ata
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
