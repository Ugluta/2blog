import Link from "next/link";
import { ContentCard } from "../components/ContentCard";
import { getGeneralSettings, getPosts, getProjects, getServices, getWorks } from "../lib/api";
import { jsonLdScriptProps } from "../lib/json-ld";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;

export default async function HomePage() {
  const [settings, posts, projects, services, works] = await Promise.all([
    getGeneralSettings(),
    getPosts(undefined, 3),
    getProjects(undefined, 3),
    getServices(undefined, 3),
    getWorks(undefined, 3),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: settings.siteName,
    description: settings.siteDescription,
    url: SITE_URL,
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScriptProps(jsonLd)} />
      <section className="mb-20 max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">2blog Core Platform</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">İçerik, hizmet ve projelerimiz tek yerde</h1>
        <p className="mt-4 text-lg leading-relaxed text-foreground/70">
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
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        <Link href={href} className="text-sm font-medium text-primary hover:underline">
          Tümünü gör →
        </Link>
      </div>
      <div className="grid gap-6 sm:grid-cols-3">{children}</div>
    </section>
  );
}
