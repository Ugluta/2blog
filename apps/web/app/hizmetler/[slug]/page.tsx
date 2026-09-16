import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServiceBySlug } from "../../../lib/api";

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

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <article>
        {service.category ? <p className="text-sm font-medium text-primary">{service.category.name}</p> : null}
        <h1 className="mt-1 text-3xl font-bold">{service.title}</h1>
        {service.excerpt ? <p className="mt-3 text-foreground/70">{service.excerpt}</p> : null}
        {service.coverImage ? <img src={service.coverImage} alt="" className="my-8 w-full rounded-lg object-cover" /> : null}
        {service.body ? <div className="whitespace-pre-wrap leading-relaxed">{service.body}</div> : null}

        {service.features.length > 0 && (
          <section className="mt-10">
            <h2 className="text-lg font-semibold">Özellikler</h2>
            <ul className="mt-3 list-inside list-disc space-y-1 text-foreground/80">
              {service.features.map((feature, index) => (
                <li key={index}>{feature}</li>
              ))}
            </ul>
          </section>
        )}

        {service.process.length > 0 && (
          <section className="mt-10">
            <h2 className="text-lg font-semibold">Süreç</h2>
            <ol className="mt-3 list-inside list-decimal space-y-1 text-foreground/80">
              {service.process.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
          </section>
        )}

        {service.faq.length > 0 && (
          <section className="mt-10">
            <h2 className="text-lg font-semibold">Sık Sorulan Sorular</h2>
            <div className="mt-3 space-y-4">
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
            className="mt-10 inline-block rounded-md bg-primary px-5 py-3 font-medium text-background hover:opacity-90"
          >
            {service.ctaLabel}
          </a>
        ) : null}
      </article>
    </main>
  );
}
