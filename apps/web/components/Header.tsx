import Link from "next/link";
import { getGeneralSettings, getMenu } from "../lib/api";

export default async function Header() {
  const [settings, menu] = await Promise.all([getGeneralSettings(), getMenu()]);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-lg font-bold tracking-tight">
          {settings.siteName}
        </Link>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-foreground/70">
          {menu.map((item) => (
            <Link key={item.id} href={item.url} className="transition-colors hover:text-primary">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
