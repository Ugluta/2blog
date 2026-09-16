import Link from "next/link";

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
  { href: "/medya", label: "Medya", requiredPermission: "MEDIA_VIEW" },
  { href: "/kullanicilar", label: "Kullanıcılar", requiredPermission: "USER_VIEW" },
  { href: "/roller", label: "Roller", requiredPermission: "ROLE_VIEW" },
  { href: "/ayarlar", label: "Ayarlar", requiredPermission: "SETTINGS_MANAGE" },
  { href: "/menu", label: "Menü", requiredPermission: "SETTINGS_MANAGE" },
  { href: "/scraper", label: "Scraper", requiredPermission: "SCRAPER_MANAGE" },
  { href: "/veri-havuzu", label: "Data Pool", requiredPermission: "DATA_POOL_MANAGE" },
];

/**
 * Hiding a link the user has no permission for is UX only — every route
 * it points to is separately enforced by the API's own guards (master
 * prompt madde 11: frontend gizleme güvenlik mekanizması değildir).
 */
export default function Sidebar({ permissions }: { permissions: string[] }) {
  const visibleItems = NAV_ITEMS.filter((item) => !item.requiredPermission || permissions.includes(item.requiredPermission));

  return (
    <aside className="w-56 shrink-0 border-r border-border bg-background">
      <div className="px-5 py-5 text-lg font-semibold">2blog Admin</div>
      <nav className="flex flex-col gap-1 px-3">
        {visibleItems.map((item) => (
          <Link key={item.href} href={item.href} className="rounded-md px-3 py-2 text-sm hover:bg-muted">
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
