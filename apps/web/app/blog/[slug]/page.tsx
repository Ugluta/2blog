import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPostBySlug } from "../../../lib/api";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};

  return {
    title: post.seoTitle ?? post.title,
    description: post.seoDescription ?? post.excerpt ?? undefined,
    alternates: post.canonicalUrl ? { canonical: post.canonicalUrl } : undefined,
    robots: post.noindex ? { index: false, follow: false } : undefined,
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <article>
        <h1 className="text-3xl font-bold">{post.title}</h1>
        {post.publishedAt ? (
          <p className="mt-2 text-sm text-foreground/60">{new Date(post.publishedAt).toLocaleDateString("tr-TR")}</p>
        ) : null}
        {post.coverImage ? <img src={post.coverImage} alt="" className="my-8 w-full rounded-lg object-cover" /> : null}
        {post.body ? <div className="mt-8 whitespace-pre-wrap leading-relaxed">{post.body}</div> : null}
        {post.tags.length > 0 && (
          <div className="mt-10 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span key={tag.id} className="rounded-full border border-border px-3 py-1 text-xs">
                {tag.name}
              </span>
            ))}
          </div>
        )}
      </article>
    </main>
  );
}
