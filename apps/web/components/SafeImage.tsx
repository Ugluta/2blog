import Image from "next/image";

interface Props {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}

/**
 * `next/image` for the deployment's own storage host (real optimization —
 * resize, lazy-load, modern formats); a plain `<img>` for everything else,
 * since `coverImage` is a free-form URL and next.config.ts only allowlists
 * the storage host (see the comment there for why).
 */
export function SafeImage({ src, alt, className, sizes, priority }: Props) {
  const isOwnStorage = isOptimizable(src);

  if (isOwnStorage) {
    return (
      <div className={className ? `relative ${className}` : "relative"}>
        <Image src={src} alt={alt} fill sizes={sizes ?? "100vw"} className="object-cover" priority={priority} />
      </div>
    );
  }

  // eslint-disable-next-line @next/next/no-img-element -- external/untrusted host, intentionally unoptimized
  return <img src={src} alt={alt} className={className} loading={priority ? "eager" : "lazy"} />;
}

function isOptimizable(src: string): boolean {
  const storageHost = process.env.STORAGE_ENDPOINT;
  if (!storageHost) return false;
  try {
    return new URL(src).hostname === storageHost;
  } catch {
    return false;
  }
}
