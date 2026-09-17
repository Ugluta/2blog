import Image from "next/image";
import type { CursorPage, Media } from "@2blog/types";
import { apiFetch } from "../../../lib/api";
import { deleteMediaAction, uploadMediaAction } from "./actions";

export default async function MediaLibraryPage() {
  const page = await apiFetch<CursorPage<Media>>("/media?limit=60");

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Medya</h1>

      <form action={uploadMediaAction} className="mb-8 flex items-center gap-3 rounded-lg border border-border bg-background p-4">
        <input type="file" name="file" required accept="image/*,video/*,audio/*,application/pdf" className="w-auto" />
        <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-background hover:opacity-90">
          Yükle
        </button>
      </form>

      {page.items.length === 0 ? (
        <p className="text-sm text-foreground/60">Henüz medya yok.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          {page.items.map((media) => (
            <div key={media.id} className="rounded-lg border border-border bg-background p-2">
              {media.kind === "IMAGE" ? (
                <div className="relative aspect-square w-full overflow-hidden rounded">
                  <Image src={media.url} alt={media.altText ?? ""} fill sizes="(min-width: 1024px) 16vw, (min-width: 640px) 25vw, 50vw" className="object-cover" />
                </div>
              ) : (
                <div className="flex aspect-square w-full items-center justify-center rounded bg-muted text-xs text-foreground/60">
                  {media.kind}
                </div>
              )}
              <p className="mt-2 truncate text-xs" title={media.originalFilename}>
                {media.originalFilename}
              </p>
              <form action={deleteMediaAction.bind(null, media.id)}>
                <button type="submit" className="mt-1 text-xs text-danger hover:underline">
                  Sil
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
