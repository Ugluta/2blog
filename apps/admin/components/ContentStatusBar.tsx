import type { ContentStatus } from "@2blog/types";
import { STATUS_ACTION_LABELS } from "../lib/content-status-labels";

interface Props {
  status: ContentStatus;
  nextStatuses: ContentStatus[];
  transitionAction: (toStatus: ContentStatus) => Promise<void>;
  deleteAction: () => Promise<void>;
}

/** Project/Service/Work ortak durum çubuğu — İçerik'in kendi [id] sayfasındaki eşdeğeri ayrı, dokunulmadı. */
export default function ContentStatusBar({ status, nextStatuses, transitionAction, deleteAction }: Props) {
  return (
    <div className="mb-8 flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-foreground/60">Durum: {status}</span>
        {nextStatuses.map((next) => (
          <form key={next} action={transitionAction.bind(null, next)}>
            <button type="submit" className="rounded-md border border-border px-3 py-1.5 text-sm hover:border-primary">
              {STATUS_ACTION_LABELS[next] ?? next}
            </button>
          </form>
        ))}
      </div>
      <form action={deleteAction}>
        <button type="submit" className="text-sm text-danger hover:underline">
          Sil
        </button>
      </form>
    </div>
  );
}
