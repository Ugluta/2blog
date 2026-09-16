import type { Content } from "@2blog/types";

interface Props {
  initial?: Pick<
    Content,
    "title" | "slug" | "excerpt" | "body" | "coverImage" | "seoTitle" | "seoDescription" | "canonicalUrl" | "noindex"
  >;
  fieldError: (name: string) => string | undefined;
}

/**
 * Shared by every Content-Engine-backed admin form (Project/Service/Work —
 * İçerik'in kendi ContentForm'u ayrı, dokunulmadı). `slug` yalnızca create'te
 * gösteriliyor; update'te content engine slug değişikliğini kabul etmiyor
 * (packages/validation/src/content.ts).
 */
export default function ContentBaseFields({ initial, fieldError }: Props) {
  return (
    <>
      <div>
        <label htmlFor="title">Başlık</label>
        <input id="title" name="title" defaultValue={initial?.title} required className="w-full" />
        {fieldError("title") ? <p className="mt-1 text-xs text-danger">{fieldError("title")}</p> : null}
      </div>

      {!initial ? (
        <div>
          <label htmlFor="slug">Slug</label>
          <input id="slug" name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" className="w-full" />
          {fieldError("slug") ? <p className="mt-1 text-xs text-danger">{fieldError("slug")}</p> : null}
        </div>
      ) : (
        <div>
          <label>Slug</label>
          <p className="text-sm text-foreground/60">{initial.slug} (değiştirilemez)</p>
        </div>
      )}

      <div>
        <label htmlFor="excerpt">Özet</label>
        <textarea id="excerpt" name="excerpt" defaultValue={initial?.excerpt ?? undefined} rows={2} className="w-full" />
      </div>

      <div>
        <label htmlFor="body">İçerik</label>
        <textarea id="body" name="body" defaultValue={initial?.body ?? undefined} rows={8} className="w-full" />
      </div>

      <div>
        <label htmlFor="coverImage">Kapak görseli URL</label>
        <input id="coverImage" name="coverImage" type="url" defaultValue={initial?.coverImage ?? undefined} className="w-full" />
      </div>

      <fieldset className="rounded-md border border-border p-4">
        <legend className="px-1 text-sm font-medium">SEO</legend>
        <div className="space-y-3">
          <div>
            <label htmlFor="seoTitle">SEO başlık</label>
            <input id="seoTitle" name="seoTitle" defaultValue={initial?.seoTitle ?? undefined} className="w-full" />
          </div>
          <div>
            <label htmlFor="seoDescription">SEO açıklama</label>
            <textarea id="seoDescription" name="seoDescription" defaultValue={initial?.seoDescription ?? undefined} rows={2} className="w-full" />
          </div>
          <div>
            <label htmlFor="canonicalUrl">Canonical URL</label>
            <input id="canonicalUrl" name="canonicalUrl" type="url" defaultValue={initial?.canonicalUrl ?? undefined} className="w-full" />
          </div>
          <label className="flex items-center gap-2 text-sm font-normal">
            <input type="checkbox" name="noindex" defaultChecked={initial?.noindex} className="w-auto" />
            noindex (arama motorlarından gizle)
          </label>
        </div>
      </fieldset>
    </>
  );
}
