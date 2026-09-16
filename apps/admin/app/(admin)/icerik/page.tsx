import Link from "next/link";
import type { Content, CursorPage } from "@2blog/types";
import { apiFetch } from "../../../lib/api";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Taslak",
  REVIEW: "İncelemede",
  APPROVED: "Onaylandı",
  SCHEDULED: "Zamanlandı",
  PUBLISHED: "Yayında",
  ARCHIVED: "Arşivde",
};

export default async function ContentListPage() {
  const page = await apiFetch<CursorPage<Content>>("/content?typeKey=post&limit=50");

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">İçerik</h1>
        <Link href="/icerik/yeni" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-background hover:opacity-90">
          Yeni içerik
        </Link>
      </div>

      {page.items.length === 0 ? (
        <p className="text-sm text-foreground/60">Henüz içerik yok.</p>
      ) : (
        <table className="w-full overflow-hidden rounded-lg border border-border bg-background text-sm">
          <thead className="bg-muted text-left text-xs uppercase tracking-wide text-foreground/60">
            <tr>
              <th className="px-4 py-3">Başlık</th>
              <th className="px-4 py-3">Durum</th>
              <th className="px-4 py-3">Güncellendi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {page.items.map((item) => (
              <tr key={item.id} className="hover:bg-muted/50">
                <td className="px-4 py-3">
                  <Link href={`/icerik/${item.id}`} className="hover:underline">
                    {item.title}
                  </Link>
                </td>
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
