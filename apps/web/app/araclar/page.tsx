import type { Metadata } from "next";
import { ContentCard } from "../../components/ContentCard";
import { getTools } from "../../lib/api";

export const metadata: Metadata = { title: "Araçlar" };

export default async function ToolsListPage() {
  const tools = await getTools();

  return (
    <main className="mx-auto max-w-5xl px-4 py-16">
      <h1 className="mb-10 text-3xl font-bold tracking-tight">Araçlar</h1>
      {tools.items.length === 0 ? (
        <p className="text-foreground/60">Henüz yayınlanmış araç yok.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tools.items.map((tool) => (
            <ContentCard
              key={tool.id}
              href={`/araclar/${tool.slug}`}
              title={tool.title}
              excerpt={tool.excerpt}
              coverImage={tool.coverImage}
              meta={tool.category ?? undefined}
            />
          ))}
        </div>
      )}
    </main>
  );
}
