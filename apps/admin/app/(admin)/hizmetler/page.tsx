import Link from "next/link";
import type { CursorPage, Service, ServiceCategory } from "@2blog/types";
import { apiFetch } from "../../../lib/api";
import { STATUS_LABELS } from "../../../lib/content-status-labels";
import CategoryForm from "./CategoryForm";

export default async function ServicesListPage() {
  const [page, categories] = await Promise.all([
    apiFetch<CursorPage<Service>>("/services?limit=50"),
    apiFetch<ServiceCategory[]>("/service-categories"),
  ]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Hizmetler</h1>
        <Link href="/hizmetler/yeni" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-background hover:opacity-90">
          Yeni hizmet
        </Link>
      </div>

      <div className="mb-8 space-y-3">
        <h2 className="text-sm font-medium text-foreground/70">Kategoriler</h2>
        {categories.length > 0 ? (
          <ul className="flex flex-wrap gap-2 text-sm">
            {categories.map((category) => (
              <li key={category.id} className="rounded-full border border-border px-3 py-1">
                {category.name}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-foreground/60">Henüz kategori yok.</p>
        )}
        <CategoryForm />
      </div>

      {page.items.length === 0 ? (
        <p className="text-sm text-foreground/60">Henüz hizmet yok.</p>
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
                  <Link href={`/hizmetler/${item.id}`} className="hover:underline">
                    {item.title}
                  </Link>
                </td>
                <td className="px-4 py-3">{item.category?.name ?? "—"}</td>
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
