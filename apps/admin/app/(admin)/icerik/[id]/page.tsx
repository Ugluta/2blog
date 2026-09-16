import { notFound } from "next/navigation";
import { CONTENT_STATUSES, type Content } from "@2blog/types";
import { canTransitionContent } from "@2blog/core-content-engine";
import { apiFetch, ApiError } from "../../../../lib/api";
import ContentForm from "../ContentForm";
import { updateContentAction, transitionContentAction, deleteContentAction } from "../actions";

const STATUS_ACTION_LABELS: Record<string, string> = {
  DRAFT: "Taslağa al",
  REVIEW: "İncelemeye gönder",
  APPROVED: "Onayla",
  SCHEDULED: "Zamanla",
  PUBLISHED: "Yayınla",
  ARCHIVED: "Arşivle",
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditContentPage({ params }: Props) {
  const { id } = await params;

  let content: Content;
  try {
    content = await apiFetch<Content>(`/content/${id}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const boundUpdate = updateContentAction.bind(null, id);
  const boundDelete = deleteContentAction.bind(null, id);
  const nextStatuses = CONTENT_STATUSES.filter((status) => canTransitionContent(content.status, status));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{content.title}</h1>
        <form action={boundDelete}>
          <button type="submit" className="text-sm text-danger hover:underline">
            Sil
          </button>
        </form>
      </div>

      <div className="mb-8 flex flex-wrap items-center gap-2">
        <span className="text-sm text-foreground/60">Durum: {content.status}</span>
        {nextStatuses.map((status) => (
          <form key={status} action={transitionContentAction.bind(null, id, status)}>
            <button type="submit" className="rounded-md border border-border px-3 py-1.5 text-sm hover:border-primary">
              {STATUS_ACTION_LABELS[status] ?? status}
            </button>
          </form>
        ))}
      </div>

      <ContentForm action={boundUpdate} initial={content} submitLabel="Kaydet" />
    </div>
  );
}
