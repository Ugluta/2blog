import type { Metadata } from "next";
import Link from "next/link";
import { ContentCard } from "../../components/ContentCard";
import { getCategories, getPosts } from "../../lib/api";

export const metadata: Metadata = { title: "Blog" };

interface Props {
  searchParams: Promise<{ kategori?: string }>;
}

export default async function BlogListPage({ searchParams }: Props) {
  const { kategori } = await searchParams;
  const categories = await getCategories();
  const activeCategory = kategori ? categories.find((category) => category.slug === kategori) : undefined;

  const posts = await getPosts(undefined, 20, activeCategory?.id);

  return (
    <main className="mx-auto max-w-5xl px-4 py-16">
      <h1 className="mb-6 text-3xl font-bold tracking-tight">Blog</h1>

      {categories.length > 0 && (
        <div className="mb-10 flex flex-wrap gap-2">
          <Link
            href="/blog"
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              !activeCategory ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground/70 hover:border-primary/40"
            }`}
          >
            Tümü
          </Link>
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/blog?kategori=${category.slug}`}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                activeCategory?.id === category.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-foreground/70 hover:border-primary/40"
              }`}
            >
              {category.name}
            </Link>
          ))}
        </div>
      )}

      {posts.items.length === 0 ? (
        <p className="text-foreground/60">
          {activeCategory ? `"${activeCategory.name}" kategorisinde henüz yayınlanmış yazı yok.` : "Henüz yayınlanmış yazı yok."}
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.items.map((post) => (
            <ContentCard
              key={post.id}
              href={`/blog/${post.slug}`}
              title={post.title}
              excerpt={post.excerpt}
              coverImage={post.coverImage}
              meta={post.categories[0]?.name}
            />
          ))}
        </div>
      )}
    </main>
  );
}
