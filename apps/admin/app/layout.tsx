import type { ReactNode } from "react";

export const metadata = {
  title: "2blog Admin",
  description: "Core Platform — admin panel",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
