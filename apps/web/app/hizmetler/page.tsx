import type { Metadata } from "next";
import { ContentCard } from "../../components/ContentCard";
import { getServices } from "../../lib/api";

export const metadata: Metadata = { title: "Hizmetlerimiz" };

export default async function ServicesListPage() {
  const services = await getServices();

  return (
    <main className="mx-auto max-w-5xl px-4 py-16">
      <h1 className="mb-10 text-3xl font-bold tracking-tight">Hizmetlerimiz</h1>
      {services.items.length === 0 ? (
        <p className="text-foreground/60">Henüz yayınlanmış hizmet yok.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.items.map((service) => (
            <ContentCard
              key={service.id}
              href={`/hizmetler/${service.slug}`}
              title={service.title}
              excerpt={service.excerpt}
              coverImage={service.coverImage}
              meta={service.category?.name}
            />
          ))}
        </div>
      )}
    </main>
  );
}
