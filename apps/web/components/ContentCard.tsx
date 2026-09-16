import Link from "next/link";

export interface ContentCardProps {
  href: string;
  title: string;
  excerpt?: string | null;
  coverImage?: string | null;
  meta?: string;
}

export function ContentCard({ href, title, excerpt, coverImage, meta }: ContentCardProps) {
  return (
    <Link
      href={href}
      className="block rounded-lg border border-border p-5 transition-colors hover:border-primary"
    >
      {coverImage ? <img src={coverImage} alt="" className="mb-4 aspect-video w-full rounded-md object-cover" /> : null}
      <h3 className="text-lg font-semibold">{title}</h3>
      {excerpt ? <p className="mt-2 text-sm text-foreground/70">{excerpt}</p> : null}
      {meta ? <p className="mt-3 text-xs uppercase tracking-wide text-foreground/50">{meta}</p> : null}
    </Link>
  );
}
