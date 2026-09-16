import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: { default: "2blog Admin", template: "%s — 2blog Admin" },
  description: "Core Platform — admin panel",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
