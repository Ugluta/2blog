import { getGeneralSettings } from "../lib/api";

export default async function Footer() {
  const settings = await getGeneralSettings();

  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-5xl px-4 py-8 text-sm text-foreground/70">
        <p>
          © {new Date().getFullYear()} {settings.siteName}
          {settings.contactEmail ? ` · ${settings.contactEmail}` : ""}
        </p>
      </div>
    </footer>
  );
}
