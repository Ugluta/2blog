import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostBySlug } from "../../../lib/api";
import { SafeImage } from "../../../components/SafeImage";
import { jsonLdScriptProps } from "../../../lib/json-ld";

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
    openGraph: {
      type: "article",
      title: post.seoTitle ?? post.title,
      description: post.seoDescription ?? post.excerpt ?? undefined,
      images: post.coverImage ? [post.coverImage] : undefined,
      publishedTime: post.publishedAt ?? undefined,
    },
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt ?? undefined,
    image: post.coverImage ?? undefined,
    datePublished: post.publishedAt ?? undefined,
    dateModified: post.updatedAt,
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScriptProps(jsonLd)} />
      <article>
        {post.categories.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-x-3 gap-y-1">
            {post.categories.map((category) => (
              <Link
                key={category.id}
                href={`/blog?kategori=${category.slug}`}
                className="text-sm font-semibold uppercase tracking-wide text-primary hover:underline"
              >
                {category.name}
              </Link>
            ))}
          </div>
        )}
        <h1 className="text-4xl font-bold tracking-tight">{post.title}</h1>
        {post.publishedAt ? (
          <p className="mt-3 text-sm text-foreground/60">{new Date(post.publishedAt).toLocaleDateString("tr-TR")}</p>
        ) : null}
        {post.coverImage ? (
          <SafeImage src={post.coverImage} alt="" className="my-10 aspect-[21/9] w-full overflow-hidden rounded-xl" priority />
        ) : null}
        {post.body ? <div className="prose-content mt-8 whitespace-pre-wrap text-[1.0625rem] leading-relaxed text-foreground/90">{post.body}</div> : null}
        {post.tags.length > 0 && (
          <div className="mt-12 flex flex-wrap gap-2 border-t border-border pt-8">
            {post.tags.map((tag) => (
              <span key={tag.id} className="rounded-full border border-border px-3 py-1 text-xs font-medium text-foreground/70">
                {tag.name}
              </span>
            ))}
          </div>
        )}
      </article>
    </main>
  );
}
