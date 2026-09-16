import Link from "next/link";
import type { CursorPage, DataPoolItem, DataPoolStatus } from "@2blog/types";
import { DATA_POOL_STATUSES } from "@2blog/types";
import { apiFetch } from "../../../lib/api";
import { approveAction, rejectAction } from "./actions";

const STATUS_LABELS: Record<DataPoolStatus, string> = {
  PROCESSED: "İncelenmedi",
  READY: "Onaylandı (yayına hazır)",
  REJECTED: "Reddedildi",
  PUBLISHED: "Yayınlandı",
};

interface Props {
  searchParams: Promise<{ status?: string }>;
}

export default async function DataPoolPage({ searchParams }: Props) {
  const { status } = await searchParams;
  const query = status ? `?status=${status}&limit=50` : "?limit=50";
  const page = await apiFetch<CursorPage<DataPoolItem>>(`/scraper/data-pool${query}`);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Data Pool</h1>

      <div className="mb-6 flex flex-wrap gap-2 text-sm">
        <Link href="/veri-havuzu" className={`rounded-full border px-3 py-1 ${!status ? "border-primary" : "border-border"}`}>
          Tümü
        </Link>
        {DATA_POOL_STATUSES.map((s) => (
          <Link key={s} href={`/veri-havuzu?status=${s}`} className={`rounded-full border px-3 py-1 ${status === s ? "border-primary" : "border-border"}`}>
            {STATUS_LABELS[s]}
          </Link>
        ))}
      </div>

      {page.items.length === 0 ? (
        <p className="text-sm text-foreground/60">Bu filtrede öğe yok.</p>
      ) : (
        <table className="w-full overflow-hidden rounded-lg border border-border bg-background text-sm">
          <thead className="bg-muted text-left text-xs uppercase tracking-wide text-foreground/60">
            <tr>
              <th className="px-4 py-3">Başlık</th>
              <th className="px-4 py-3">Durum</th>
              <th className="px-4 py-3">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {page.items.map((item) => (
              <tr key={item.id} className="hover:bg-muted/50">
                <td className="px-4 py-3">
                  <Link href={`/veri-havuzu/${item.id}`} className="hover:underline">
                    {item.title}
                  </Link>
                </td>
                <td className="px-4 py-3">{STATUS_LABELS[item.status]}</td>
                <td className="px-4 py-3">
                  {item.status === "PROCESSED" ? (
                    <div className="flex items-center gap-2">
                      <form action={approveAction.bind(null, item.id)}>
                        <button type="submit" className="rounded-md border border-border px-2 py-1 text-xs hover:border-primary">
                          Onayla
                        </button>
                      </form>
                      <form action={rejectAction.bind(null, item.id)}>
                        <button type="submit" className="rounded-md border border-border px-2 py-1 text-xs text-danger hover:border-danger">
                          Reddet
                        </button>
                      </form>
                    </div>
                  ) : (
                    <Link href={`/veri-havuzu/${item.id}`} className="text-xs text-foreground/60 hover:underline">
                      Detay
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
