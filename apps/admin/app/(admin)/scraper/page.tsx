import Link from "next/link";
import type { ScraperSource } from "@2blog/types";
import { apiFetch } from "../../../lib/api";
import SourceForm from "./SourceForm";

export default async function ScraperSourcesPage() {
  const sources = await apiFetch<ScraperSource[]>("/scraper/sources");

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Scraper Kaynakları</h1>

      <SourceForm />

      {sources.length === 0 ? (
        <p className="text-sm text-foreground/60">Henüz kaynak yok.</p>
      ) : (
        <table className="w-full overflow-hidden rounded-lg border border-border bg-background text-sm">
          <thead className="bg-muted text-left text-xs uppercase tracking-wide text-foreground/60">
            <tr>
              <th className="px-4 py-3">Ad</th>
              <th className="px-4 py-3">Liste URL</th>
              <th className="px-4 py-3">Tür</th>
              <th className="px-4 py-3">Etkin</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sources.map((source) => (
              <tr key={source.id} className="hover:bg-muted/50">
                <td className="px-4 py-3">
                  <Link href={`/scraper/${source.id}`} className="hover:underline">
                    {source.name}
                  </Link>
                </td>
                <td className="max-w-xs truncate px-4 py-3 text-foreground/60">{source.listUrl}</td>
                <td className="px-4 py-3">{source.typeKey}</td>
                <td className="px-4 py-3">{source.isEnabled ? "Evet" : "Hayır"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
