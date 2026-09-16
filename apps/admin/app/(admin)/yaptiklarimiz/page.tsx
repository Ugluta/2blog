import Link from "next/link";
import type { CursorPage, Work } from "@2blog/types";
import { apiFetch } from "../../../lib/api";
import { STATUS_LABELS } from "../../../lib/content-status-labels";

export default async function WorksListPage() {
  const page = await apiFetch<CursorPage<Work>>("/works?limit=50");

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Yaptıklarımız</h1>
        <Link href="/yaptiklarimiz/yeni" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-background hover:opacity-90">
          Yeni iş
        </Link>
      </div>

      {page.items.length === 0 ? (
        <p className="text-sm text-foreground/60">Henüz iş yok.</p>
      ) : (
        <table className="w-full overflow-hidden rounded-lg border border-border bg-background text-sm">
          <thead className="bg-muted text-left text-xs uppercase tracking-wide text-foreground/60">
            <tr>
              <th className="px-4 py-3">Başlık</th>
              <th className="px-4 py-3">Kategori</th>
              <th className="px-4 py-3">Durum</th>
              <th className="px-4 py-3">Güncellendi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {page.items.map((item) => (
              <tr key={item.id} className="hover:bg-muted/50">
                <td className="px-4 py-3">
                  <Link href={`/yaptiklarimiz/${item.id}`} className="hover:underline">
                    {item.title}
                  </Link>
                </td>
                <td className="px-4 py-3">{item.category ?? "—"}</td>
                <td className="px-4 py-3">{STATUS_LABELS[item.status] ?? item.status}</td>
                <td className="px-4 py-3 text-foreground/60">{new Date(item.updatedAt).toLocaleString("tr-TR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
