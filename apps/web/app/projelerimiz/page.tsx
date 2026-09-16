import type { Metadata } from "next";
import { ContentCard } from "../../components/ContentCard";
import { getProjects } from "../../lib/api";

export const metadata: Metadata = { title: "Projelerimiz" };

export default async function ProjectsListPage() {
  const projects = await getProjects();

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="mb-8 text-2xl font-bold">Projelerimiz</h1>
      {projects.items.length === 0 ? (
        <p className="text-foreground/60">Henüz yayınlanmış proje yok.</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects.items.map((project) => (
            <ContentCard
              key={project.id}
              href={`/projelerimiz/${project.slug}`}
              title={project.title}
              excerpt={project.excerpt}
              coverImage={project.coverImage}
              meta={project.projectStatus}
            />
          ))}
        </div>
      )}
    </main>
  );
}
