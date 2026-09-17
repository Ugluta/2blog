import type { Metadata } from "next";
import { ContentCard } from "../../components/ContentCard";
import { getPosts } from "../../lib/api";

export const metadata: Metadata = { title: "Blog" };

export default async function BlogListPage() {
  const posts = await getPosts();

  return (
    <main className="mx-auto max-w-5xl px-4 py-16">
      <h1 className="mb-10 text-3xl font-bold tracking-tight">Blog</h1>
      {posts.items.length === 0 ? (
        <p className="text-foreground/60">Henüz yayınlanmış yazı yok.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.items.map((post) => (
            <ContentCard key={post.id} href={`/blog/${post.slug}`} title={post.title} excerpt={post.excerpt} coverImage={post.coverImage} />
          ))}
        </div>
      )}
    </main>
  );
}
