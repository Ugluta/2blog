import Link from "next/link";
import { ContentCard } from "../components/ContentCard";
import { getPosts, getProjects, getServices, getWorks } from "../lib/api";

export default async function HomePage() {
  const [posts, projects, services, works] = await Promise.all([
    getPosts(undefined, 3),
    getProjects(3),
    getServices(3),
    getWorks(3),
  ]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <section className="mb-16">
        <h1 className="text-3xl font-bold">İçerik, hizmet ve projelerimiz tek yerde</h1>
        <p className="mt-3 max-w-2xl text-foreground/70">
          Blog yazılarımız, hizmetlerimiz, projelerimiz ve yaptığımız işler — tek bir çekirdek üzerinde.
        </p>
      </section>

      {services.items.length > 0 && (
        <Section title="Hizmetlerimiz" href="/hizmetler">
          {services.items.map((service) => (
            <ContentCard key={service.id} href={`/hizmetler/${service.slug}`} title={service.title} excerpt={service.excerpt} coverImage={service.coverImage} meta={service.category?.name} />
          ))}
        </Section>
      )}

      {projects.items.length > 0 && (
        <Section title="Projelerimiz" href="/projelerimiz">
          {projects.items.map((project) => (
            <ContentCard key={project.id} href={`/projelerimiz/${project.slug}`} title={project.title} excerpt={project.excerpt} coverImage={project.coverImage} meta={project.projectStatus} />
          ))}
        </Section>
      )}

      {posts.items.length > 0 && (
        <Section title="Son Yazılar" href="/blog">
          {posts.items.map((post) => (
            <ContentCard key={post.id} href={`/blog/${post.slug}`} title={post.title} excerpt={post.excerpt} coverImage={post.coverImage} />
          ))}
        </Section>
      )}

      {works.items.length > 0 && (
        <Section title="Yaptıklarımız" href="/yaptiklarimiz">
          {works.items.map((work) => (
            <ContentCard key={work.id} href={`/yaptiklarimiz/${work.slug}`} title={work.title} excerpt={work.excerpt} coverImage={work.coverImage} meta={work.category ?? undefined} />
          ))}
        </Section>
      )}

      {posts.items.length === 0 && projects.items.length === 0 && services.items.length === 0 && works.items.length === 0 && (
        <p className="text-foreground/60">Henüz yayınlanmış içerik yok.</p>
      )}
    </main>
  );
}

function Section({ title, href, children }: { title: string; href: string; children: React.ReactNode }) {
  return (
    <section className="mb-16">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-semibold">{title}</h2>
        <Link href={href} className="text-sm text-primary hover:underline">
          Tümünü gör →
        </Link>
      </div>
      <div className="grid gap-5 sm:grid-cols-3">{children}</div>
    </section>
  );
}
