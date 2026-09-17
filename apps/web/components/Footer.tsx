import Link from "next/link";
import { getGeneralSettings, getMenu, getSocialSettings } from "../lib/api";

const SOCIAL_LABELS: Record<keyof Awaited<ReturnType<typeof getSocialSettings>>, string> = {
  facebookUrl: "Facebook",
  twitterUrl: "X (Twitter)",
  instagramUrl: "Instagram",
  linkedinUrl: "LinkedIn",
  youtubeUrl: "YouTube",
};

export default async function Footer() {
  const [settings, menu, social] = await Promise.all([getGeneralSettings(), getMenu(), getSocialSettings()]);
  const socialLinks = (Object.keys(SOCIAL_LABELS) as (keyof typeof SOCIAL_LABELS)[])
    .map((key) => ({ key, url: social[key], label: SOCIAL_LABELS[key] }))
    .filter((entry): entry is { key: keyof typeof SOCIAL_LABELS; url: string; label: string } => Boolean(entry.url));

  return (
    <footer className="border-t border-border bg-muted">
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="grid gap-10 sm:grid-cols-3">
          <div>
            <p className="text-base font-bold tracking-tight">{settings.siteName}</p>
            {settings.siteDescription ? <p className="mt-2 max-w-xs text-sm text-foreground/60">{settings.siteDescription}</p> : null}
          </div>

          {menu.length > 0 ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-foreground/50">Bağlantılar</p>
              <ul className="mt-3 space-y-2 text-sm">
                {menu.map((item) => (
                  <li key={item.id}>
                    <Link href={item.url} className="text-foreground/70 transition-colors hover:text-primary">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div>
            {settings.contactEmail ? (
              <>
                <p className="text-xs font-semibold uppercase tracking-wide text-foreground/50">İletişim</p>
                <a href={`mailto:${settings.contactEmail}`} className="mt-3 block text-sm text-foreground/70 hover:text-primary">
                  {settings.contactEmail}
                </a>
              </>
            ) : null}
            {socialLinks.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                {socialLinks.map((entry) => (
                  <a key={entry.key} href={entry.url} target="_blank" rel="noreferrer" className="text-foreground/70 hover:text-primary">
                    {entry.label}
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <p className="mt-10 border-t border-border pt-6 text-xs text-foreground/50">
          © {new Date().getFullYear()} {settings.siteName}. Tüm hakları saklıdır.
        </p>
      </div>
    </footer>
  );
}
