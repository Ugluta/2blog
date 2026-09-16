import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-24 text-center">
      <h1 className="text-3xl font-bold">Sayfa bulunamadı</h1>
      <p className="mt-3 text-foreground/70">Aradığınız sayfa yayınlanmamış ya da kaldırılmış olabilir.</p>
      <Link href="/" className="mt-8 inline-block text-primary hover:underline">
        Ana sayfaya dön
      </Link>
    </main>
  );
}
