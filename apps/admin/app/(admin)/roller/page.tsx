import type { Permission, Role } from "@2blog/types";
import { apiFetch } from "../../../lib/api";
import { attachPermissionAction } from "./actions";
import CreateRoleForm from "./CreateRoleForm";

export default async function RolesListPage() {
  const [roles, permissions] = await Promise.all([
    apiFetch<Role[]>("/roles"),
    apiFetch<Permission[]>("/permissions"),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Roller</h1>

      <CreateRoleForm />

      <p className="mb-4 text-sm text-foreground/60">
        Not: API bir rolün hangi izinlere zaten sahip olduğunu listeleyen bir uç sunmuyor — aşağıdaki form yalnızca yeni izin
        ekler, mevcut izinleri göstermez.
      </p>

      {roles.length === 0 ? (
        <p className="text-sm text-foreground/60">Henüz rol yok.</p>
      ) : (
        <table className="w-full overflow-hidden rounded-lg border border-border bg-background text-sm">
          <thead className="bg-muted text-left text-xs uppercase tracking-wide text-foreground/60">
            <tr>
              <th className="px-4 py-3">Anahtar</th>
              <th className="px-4 py-3">Etiket</th>
              <th className="px-4 py-3">İzin ekle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {roles.map((role) => (
              <tr key={role.id} className="hover:bg-muted/50">
                <td className="px-4 py-3 font-mono text-xs">{role.key}</td>
                <td className="px-4 py-3">{role.label}</td>
                <td className="px-4 py-3">
                  <form action={attachPermissionAction.bind(null, role.id)} className="flex items-center gap-2">
                    <select name="permissionKey" required className="w-auto text-xs" disabled={permissions.length === 0}>
                      {permissions.map((permission) => (
                        <option key={permission.id} value={permission.key}>
                          {permission.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      disabled={permissions.length === 0}
                      className="rounded-md border border-border px-2 py-1 text-xs hover:border-primary disabled:opacity-50"
                    >
                      Ekle
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
