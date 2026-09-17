import { notFound } from "next/navigation";
import Link from "next/link";
import type { DataPoolItem } from "@2blog/types";
import { apiFetch, ApiError } from "../../../../lib/api";
import { approveAction, rejectAction } from "../actions";
import PublishForm from "../PublishForm";

function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DataPoolItemPage({ params }: Props) {
  const { id } = await params;

  let item: DataPoolItem;
  try {
    item = await apiFetch<DataPoolItem>(`/scraper/data-pool/${id}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  return (
    <div className="max-w-3xl">
      <h1 className="mb-1 text-2xl font-bold">{item.title}</h1>
      <p className="mb-6 text-sm text-foreground/60">
        Kaynak:{" "}
        <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="hover:underline">
          {item.sourceUrl}
        </a>
      </p>

      {item.status === "PROCESSED" ? (
        <div className="mb-6 flex items-center gap-3">
          <form action={approveAction.bind(null, id)}>
            <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-background hover:opacity-90">
              Onayla
            </button>
          </form>
          <form action={rejectAction.bind(null, id)} className="flex items-center gap-2">
            <input name="reason" placeholder="Red sebebi (opsiyonel)" className="w-64 text-sm" />
            <button type="submit" className="rounded-md border border-border px-4 py-2 text-sm text-danger hover:border-danger">
              Reddet
            </button>
          </form>
        </div>
      ) : null}

      {item.status === "READY" ? (
        <div className="mb-6">
          <PublishForm id={id} suggestedSlug={slugify(item.title)} />
        </div>
      ) : null}

      {item.status === "REJECTED" ? (
        <p className="mb-6 text-sm text-danger">Reddedildi{item.rejectionReason ? `: ${item.rejectionReason}` : "."}</p>
      ) : null}

      {item.status === "PUBLISHED" && item.contentId ? (
        <p className="mb-6 text-sm">
          Yayınlandı —{" "}
          <Link href={`/icerik/${item.contentId}`} className="text-primary hover:underline">
            İçerikte görüntüle
          </Link>
        </p>
      ) : null}

      {item.coverImage ? (
        // Scraped from an arbitrary external site — intentionally not next/image:
        // the optimizer would fetch/resize whatever host this points to, which is
        // exactly what next.config.ts's remotePatterns allowlist exists to prevent.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.coverImage} alt="" className="mb-4 max-h-80 rounded-md object-cover" />
      ) : null}

      {item.excerpt ? <p className="mb-4 text-foreground/70">{item.excerpt}</p> : null}
      {item.body ? <div className="whitespace-pre-wrap text-sm leading-relaxed">{item.body}</div> : null}
    </div>
  );
}
