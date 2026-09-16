import Link from "next/link";
import { getGeneralSettings, getMenu } from "../lib/api";

export default async function Header() {
  const [settings, menu] = await Promise.all([getGeneralSettings(), getMenu()]);

  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-lg font-semibold">
          {settings.siteName}
        </Link>
        <nav className="flex gap-6 text-sm">
          {menu.map((item) => (
            <Link key={item.id} href={item.url} className="hover:text-primary">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
