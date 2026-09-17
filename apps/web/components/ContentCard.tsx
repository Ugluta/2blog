import Link from "next/link";
import { SafeImage } from "./SafeImage";

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
      className="group block rounded-lg border border-border bg-background p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
    >
      {coverImage ? (
        <SafeImage src={coverImage} alt="" className="mb-4 aspect-video w-full overflow-hidden rounded-md" sizes="(min-width: 640px) 33vw, 100vw" />
      ) : null}
      <h3 className="text-lg font-semibold group-hover:text-primary">{title}</h3>
      {excerpt ? <p className="mt-2 text-sm text-foreground/70">{excerpt}</p> : null}
      {meta ? <p className="mt-3 text-xs font-medium uppercase tracking-wide text-foreground/50">{meta}</p> : null}
    </Link>
  );
}
