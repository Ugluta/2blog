import type { Metadata } from "next";
import type { ReactNode } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { getGeneralSettings } from "../lib/api";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getGeneralSettings();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  return {
    title: { default: settings.siteName, template: `%s — ${settings.siteName}` },
    description: settings.siteDescription,
    metadataBase: siteUrl ? new URL(siteUrl) : undefined,
    openGraph: {
      siteName: settings.siteName,
      type: "website",
      locale: "tr_TR",
    },
  };
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr">
      <body className="flex min-h-screen flex-col">
        <Header />
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
