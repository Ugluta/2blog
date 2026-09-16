import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getWorkBySlug } from "../../../lib/api";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const work = await getWorkBySlug(slug);
  if (!work) return {};

  return {
    title: work.seoTitle ?? work.title,
    description: work.seoDescription ?? work.excerpt ?? undefined,
    alternates: work.canonicalUrl ? { canonical: work.canonicalUrl } : undefined,
    robots: work.noindex ? { index: false, follow: false } : undefined,
  };
}

export default async function WorkPage({ params }: Props) {
  const { slug } = await params;
  const work = await getWorkBySlug(slug);
  if (!work) notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <article>
        {work.category ? <p className="text-sm font-medium text-primary">{work.category}</p> : null}
        <h1 className="mt-1 text-3xl font-bold">{work.title}</h1>
        {work.workDate ? (
          <p className="mt-2 text-sm text-foreground/60">{new Date(work.workDate).toLocaleDateString("tr-TR")}</p>
        ) : null}
        {work.excerpt ? <p className="mt-3 text-foreground/70">{work.excerpt}</p> : null}
        {work.coverImage ? <img src={work.coverImage} alt="" className="my-8 w-full rounded-lg object-cover" /> : null}
        {work.body ? <div className="whitespace-pre-wrap leading-relaxed">{work.body}</div> : null}

        {work.technologies.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2">
            {work.technologies.map((tech) => (
              <span key={tech} className="rounded-full border border-border px-3 py-1 text-xs">
                {tech}
              </span>
            ))}
          </div>
        )}

        {work.result ? (
          <section className="mt-10">
            <h2 className="text-lg font-semibold">Sonuç</h2>
            <p className="mt-2 text-foreground/80">{work.result}</p>
          </section>
        ) : null}

        {work.links.length > 0 && (
          <div className="mt-10 flex flex-wrap gap-4">
            {work.links.map((link) => (
              <a key={link.url} href={link.url} className="rounded-md border border-border px-5 py-3 font-medium hover:border-primary">
                {link.label}
              </a>
            ))}
          </div>
        )}
      </article>
    </main>
  );
}
