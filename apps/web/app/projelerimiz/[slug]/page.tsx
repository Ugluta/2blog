import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProjectBySlug } from "../../../lib/api";
import { SafeImage } from "../../../components/SafeImage";
import { jsonLdScriptProps } from "../../../lib/json-ld";

interface Props {
  params: Promise<{ slug: string }>;
}

const PROJECT_STATUS_LABELS: Record<string, string> = {
  CONCEPT: "Konsept",
  PLANNING: "Planlama",
  DEVELOPMENT: "Geliştirme",
  COMPLETED: "Tamamlandı",
  MAINTENANCE: "Bakım",
  ARCHIVED: "Arşivlendi",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return {};

  return {
    title: project.seoTitle ?? project.title,
    description: project.seoDescription ?? project.excerpt ?? undefined,
    alternates: project.canonicalUrl ? { canonical: project.canonicalUrl } : undefined,
    robots: project.noindex ? { index: false, follow: false } : undefined,
  };
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    description: project.excerpt ?? undefined,
    image: project.coverImage ?? undefined,
    dateModified: project.updatedAt,
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScriptProps(jsonLd)} />
      <article>
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">{PROJECT_STATUS_LABELS[project.projectStatus] ?? project.projectStatus}</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight">{project.title}</h1>
        {project.excerpt ? <p className="mt-4 text-lg text-foreground/70">{project.excerpt}</p> : null}
        {project.coverImage ? (
          <SafeImage src={project.coverImage} alt="" className="my-10 aspect-[21/9] w-full overflow-hidden rounded-xl" priority />
        ) : null}
        {project.body ? <div className="text-[1.0625rem] leading-relaxed text-foreground/90 whitespace-pre-wrap">{project.body}</div> : null}

        {project.technologies.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2">
            {project.technologies.map((tech) => (
              <span key={tech} className="rounded-full border border-border px-3 py-1 text-xs">
                {tech}
              </span>
            ))}
          </div>
        )}

        {project.problem ? (
          <section className="mt-10">
            <h2 className="text-lg font-semibold">Problem</h2>
            <p className="mt-2 text-foreground/80">{project.problem}</p>
          </section>
        ) : null}

        {project.solution ? (
          <section className="mt-8">
            <h2 className="text-lg font-semibold">Çözüm</h2>
            <p className="mt-2 text-foreground/80">{project.solution}</p>
          </section>
        ) : null}

        {project.results ? (
          <section className="mt-8">
            <h2 className="text-lg font-semibold">Sonuçlar</h2>
            <p className="mt-2 text-foreground/80">{project.results}</p>
          </section>
        ) : null}

        {(project.demoUrl || project.repoUrl) && (
          <div className="mt-10 flex gap-4">
            {project.demoUrl ? (
              <a href={project.demoUrl} className="rounded-md bg-primary px-5 py-3 font-medium text-background hover:opacity-90">
                Demo
              </a>
            ) : null}
            {project.repoUrl ? (
              <a href={project.repoUrl} className="rounded-md border border-border px-5 py-3 font-medium hover:border-primary">
                Repository
              </a>
            ) : null}
          </div>
        )}
      </article>
    </main>
  );
}
