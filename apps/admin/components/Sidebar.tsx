"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
  requiredPermission?: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Panel" },
  { href: "/icerik", label: "İçerik", requiredPermission: "CONTENT_VIEW" },
  { href: "/projelerimiz", label: "Projelerimiz", requiredPermission: "CONTENT_VIEW" },
  { href: "/hizmetler", label: "Hizmetler", requiredPermission: "CONTENT_VIEW" },
  { href: "/yaptiklarimiz", label: "Yaptıklarımız", requiredPermission: "CONTENT_VIEW" },
  { href: "/araclar", label: "Araçlar", requiredPermission: "CONTENT_VIEW" },
  { href: "/medya", label: "Medya", requiredPermission: "MEDIA_VIEW" },
  { href: "/kullanicilar", label: "Kullanıcılar", requiredPermission: "USER_VIEW" },
  { href: "/roller", label: "Roller", requiredPermission: "ROLE_VIEW" },
  { href: "/ayarlar", label: "Ayarlar", requiredPermission: "SETTINGS_MANAGE" },
  { href: "/menu", label: "Menü", requiredPermission: "SETTINGS_MANAGE" },
  { href: "/scraper", label: "Scraper", requiredPermission: "SCRAPER_MANAGE" },
  { href: "/veri-havuzu", label: "Data Pool", requiredPermission: "DATA_POOL_MANAGE" },
  { href: "/ai", label: "AI", requiredPermission: "AI_USE" },
];

/**
 * Hiding a link the user has no permission for is UX only — every route
 * it points to is separately enforced by the API's own guards (master
 * prompt madde 11: frontend gizleme güvenlik mekanizması değildir).
 */
export default function Sidebar({ permissions }: { permissions: string[] }) {
  const pathname = usePathname();
  const visibleItems = NAV_ITEMS.filter((item) => !item.requiredPermission || permissions.includes(item.requiredPermission));

  return (
    <aside className="w-56 shrink-0 border-r border-border bg-background">
      <div className="flex items-center gap-2 px-5 py-5">
        <span className="h-2 w-2 rounded-sm bg-primary" />
        <span className="text-base font-bold tracking-tight">2blog Admin</span>
      </div>
      <nav className="flex flex-col gap-0.5 px-3">
        {visibleItems.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-md px-3 py-2 text-sm transition-colors ${
                isActive ? "bg-primary/10 font-medium text-primary" : "text-foreground/80 hover:bg-muted"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
