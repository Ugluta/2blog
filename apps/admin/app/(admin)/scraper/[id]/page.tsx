import { notFound } from "next/navigation";
import type { CrawlJob, ScraperRule, ScraperSource } from "@2blog/types";
import { apiFetch, ApiError } from "../../../../lib/api";
import RuleForm from "../RuleForm";
import { toggleSourceEnabledAction, triggerCrawlAction } from "../actions";

const JOB_STATUS_LABELS: Record<string, string> = {
  PENDING: "Bekliyor",
  RUNNING: "Çalışıyor",
  SUCCESS: "Başarılı",
  FAILED: "Başarısız",
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ScraperSourceDetailPage({ params }: Props) {
  const { id } = await params;

  let source: ScraperSource;
  try {
    source = await apiFetch<ScraperSource>(`/scraper/sources/${id}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const [rules, jobs] = await Promise.all([
    apiFetch<ScraperRule[]>(`/scraper/rules?sourceId=${id}`),
    apiFetch<CrawlJob[]>(`/scraper/jobs?sourceId=${id}`),
  ]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{source.name}</h1>
        <form action={toggleSourceEnabledAction.bind(null, id, !source.isEnabled)}>
          <button type="submit" className="rounded-md border border-border px-3 py-1.5 text-sm hover:border-primary">
            {source.isEnabled ? "Devre dışı bırak" : "Etkinleştir"}
          </button>
        </form>
      </div>
      <p className="mb-8 text-sm text-foreground/60">
        {source.listUrl} · selector: <code>{source.listItemSelector}</code> · typeKey: {source.typeKey}
      </p>

      <h2 className="mb-3 text-lg font-semibold">Kurallar</h2>
      <RuleForm sourceId={id} />

      {rules.length === 0 ? (
        <p className="mb-8 text-sm text-foreground/60">Henüz kural yok — tarama başlatmak için önce bir kural ekleyin.</p>
      ) : (
        <div className="mb-8">
          <form action={triggerCrawlAction.bind(null, id)} className="flex items-center gap-2 rounded-lg border border-border bg-background p-4">
            <select name="ruleId" required className="text-sm">
              {rules.map((rule) => (
                <option key={rule.id} value={rule.id}>
                  {rule.name}
                </option>
              ))}
            </select>
            <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-background hover:opacity-90">
              Şimdi tara
            </button>
          </form>
        </div>
      )}

      <h2 className="mb-3 text-lg font-semibold">Tarama geçmişi</h2>
      {jobs.length === 0 ? (
        <p className="text-sm text-foreground/60">Henüz tarama çalıştırılmadı.</p>
      ) : (
        <table className="w-full overflow-hidden rounded-lg border border-border bg-background text-sm">
          <thead className="bg-muted text-left text-xs uppercase tracking-wide text-foreground/60">
            <tr>
              <th className="px-4 py-3">Durum</th>
              <th className="px-4 py-3">Bulunan</th>
              <th className="px-4 py-3">Yeni</th>
              <th className="px-4 py-3">Hata</th>
              <th className="px-4 py-3">Başladı</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {jobs.map((job) => (
              <tr key={job.id} className="hover:bg-muted/50">
                <td className="px-4 py-3">{JOB_STATUS_LABELS[job.status] ?? job.status}</td>
                <td className="px-4 py-3">{job.itemsFound}</td>
                <td className="px-4 py-3">{job.itemsNew}</td>
                <td className="max-w-xs truncate px-4 py-3 text-danger">{job.errorMessage ?? "—"}</td>
                <td className="px-4 py-3 text-foreground/60">{job.startedAt ? new Date(job.startedAt).toLocaleString("tr-TR") : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
