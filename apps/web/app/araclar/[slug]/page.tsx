import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getToolBySlug } from "../../../lib/api";
import { SafeImage } from "../../../components/SafeImage";
import { jsonLdScriptProps } from "../../../lib/json-ld";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tool = await getToolBySlug(slug);
  if (!tool) return {};

  return {
    title: tool.seoTitle ?? tool.title,
    description: tool.seoDescription ?? tool.excerpt ?? undefined,
    alternates: tool.canonicalUrl ? { canonical: tool.canonicalUrl } : undefined,
    robots: tool.noindex ? { index: false, follow: false } : undefined,
  };
}

export default async function ToolPage({ params }: Props) {
  const { slug } = await params;
  const tool = await getToolBySlug(slug);
  if (!tool) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: tool.title,
    description: tool.excerpt ?? undefined,
    image: tool.coverImage ?? undefined,
    applicationCategory: tool.category ?? undefined,
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScriptProps(jsonLd)} />
      <article>
        {tool.category ? <p className="text-sm font-semibold uppercase tracking-wide text-primary">{tool.category}</p> : null}
        <h1 className="mt-2 text-4xl font-bold tracking-tight">{tool.title}</h1>
        {tool.excerpt ? <p className="mt-4 text-lg text-foreground/70">{tool.excerpt}</p> : null}
        {tool.coverImage ? (
          <SafeImage src={tool.coverImage} alt="" className="my-10 aspect-[21/9] w-full overflow-hidden rounded-xl" priority />
        ) : null}
        {tool.body ? <div className="text-[1.0625rem] leading-relaxed text-foreground/90 whitespace-pre-wrap">{tool.body}</div> : null}

        {tool.instructions ? (
          <section className="mt-10 rounded-lg border border-border bg-muted p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground/60">Nasıl kullanılır</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/80">{tool.instructions}</p>
          </section>
        ) : null}

        <section className="mt-10">
          <h2 className="mb-4 text-lg font-semibold">Aracı Çalıştır</h2>
          {/*
            embedUrl is admin-set but points at an arbitrary external URL, so
            this stays sandboxed with no allow-same-origin (combined with
            allow-scripts that would let the embedded page break out of the
            sandbox) and no top-level navigation — same trust boundary as
            SafeImage: who can set it is controlled by RBAC, what it points
            to is not.
          */}
          <iframe
            src={tool.embedUrl}
            title={tool.title}
            className="h-[600px] w-full rounded-lg border border-border"
            sandbox="allow-scripts allow-forms allow-popups"
            referrerPolicy="no-referrer"
            loading="lazy"
          />
        </section>
      </article>
    </main>
  );
}
