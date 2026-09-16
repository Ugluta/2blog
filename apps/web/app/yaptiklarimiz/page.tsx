import type { Metadata } from "next";
import { ContentCard } from "../../components/ContentCard";
import { getWorks } from "../../lib/api";

export const metadata: Metadata = { title: "Yaptıklarımız" };

export default async function WorksListPage() {
  const works = await getWorks();

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="mb-8 text-2xl font-bold">Yaptıklarımız</h1>
      {works.items.length === 0 ? (
        <p className="text-foreground/60">Henüz yayınlanmış kayıt yok.</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {works.items.map((work) => (
            <ContentCard
              key={work.id}
              href={`/yaptiklarimiz/${work.slug}`}
              title={work.title}
              excerpt={work.excerpt}
              coverImage={work.coverImage}
              meta={work.category ?? undefined}
            />
          ))}
        </div>
      )}
    </main>
  );
}
