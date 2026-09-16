import Link from "next/link";
import type { Content, CursorPage } from "@2blog/types";
import { apiFetch } from "../../lib/api";

export default async function DashboardPage() {
  const recent = await apiFetch<CursorPage<Content>>("/content?limit=5").catch(() => null);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Panel</h1>

      <div className="mb-8 flex gap-4">
        <Link href="/icerik/yeni" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-background hover:opacity-90">
          Yeni içerik
        </Link>
        <Link href="/medya" className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:border-primary">
          Medya kütüphanesi
        </Link>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Son içerikler</h2>
        {recent && recent.items.length > 0 ? (
          <ul className="divide-y divide-border rounded-lg border border-border bg-background">
            {recent.items.map((item) => (
              <li key={item.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <Link href={`/icerik/${item.id}`} className="hover:underline">
                  {item.title}
                </Link>
                <span className="text-xs uppercase tracking-wide text-foreground/50">
                  {item.typeKey} · {item.status}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-foreground/60">Henüz içerik yok.</p>
        )}
      </section>
    </div>
  );
}
