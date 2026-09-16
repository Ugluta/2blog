import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-muted px-4 text-center">
      <h1 className="text-2xl font-bold">Bulunamadı</h1>
      <Link href="/" className="text-primary hover:underline">
        Panele dön
      </Link>
    </main>
  );
}
