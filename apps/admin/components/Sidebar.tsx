import Link from "next/link";

interface NavItem {
  href: string;
  label: string;
  requiredPermission?: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Panel" },
  { href: "/icerik", label: "İçerik", requiredPermission: "CONTENT_VIEW" },
  { href: "/medya", label: "Medya", requiredPermission: "MEDIA_VIEW" },
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
