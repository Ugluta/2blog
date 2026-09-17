import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServiceBySlug } from "../../../lib/api";
import { SafeImage } from "../../../components/SafeImage";
import { jsonLdScriptProps } from "../../../lib/json-ld";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service) return {};

  return {
    title: service.seoTitle ?? service.title,
    description: service.seoDescription ?? service.excerpt ?? undefined,
    alternates: service.canonicalUrl ? { canonical: service.canonicalUrl } : undefined,
    robots: service.noindex ? { index: false, follow: false } : undefined,
  };
}

export default async function ServicePage({ params }: Props) {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.title,
    description: service.excerpt ?? undefined,
    image: service.coverImage ?? undefined,
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScriptProps(jsonLd)} />
      <article>
        {service.category ? <p className="text-sm font-semibold uppercase tracking-wide text-primary">{service.category.name}</p> : null}
        <h1 className="mt-2 text-4xl font-bold tracking-tight">{service.title}</h1>
        {service.excerpt ? <p className="mt-4 text-lg text-foreground/70">{service.excerpt}</p> : null}
        {service.coverImage ? (
          <SafeImage src={service.coverImage} alt="" className="my-10 aspect-[21/9] w-full overflow-hidden rounded-xl" priority />
        ) : null}
        {service.body ? <div className="text-[1.0625rem] leading-relaxed text-foreground/90 whitespace-pre-wrap">{service.body}</div> : null}

        {service.features.length > 0 && (
          <section className="mt-12 rounded-xl border border-border bg-muted p-6">
            <h2 className="text-lg font-semibold">Özellikler</h2>
            <ul className="mt-3 list-inside list-disc space-y-1.5 text-foreground/80">
              {service.features.map((feature, index) => (
                <li key={index}>{feature}</li>
              ))}
            </ul>
          </section>
        )}

        {service.process.length > 0 && (
          <section className="mt-8">
            <h2 className="text-lg font-semibold">Süreç</h2>
            <ol className="mt-3 list-inside list-decimal space-y-1.5 text-foreground/80">
              {service.process.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
          </section>
        )}

        {service.faq.length > 0 && (
          <section className="mt-10 border-t border-border pt-8">
            <h2 className="text-lg font-semibold">Sık Sorulan Sorular</h2>
            <div className="mt-4 space-y-5">
              {service.faq.map((entry, index) => (
                <div key={index}>
                  <p className="font-medium">{entry.question}</p>
                  <p className="mt-1 text-foreground/70">{entry.answer}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {service.ctaUrl && service.ctaLabel ? (
          <a
            href={service.ctaUrl}
            className="mt-10 inline-block rounded-md bg-primary px-6 py-3 font-medium text-background shadow-sm transition-opacity hover:opacity-90"
          >
            {service.ctaLabel}
          </a>
        ) : null}
      </article>
    </main>
  );
}
