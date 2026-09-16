import { notFound } from "next/navigation";
import { CONTENT_STATUSES, type Content } from "@2blog/types";
import { canTransitionContent } from "@2blog/core-content-engine";
import { apiFetch, ApiError } from "../../../../lib/api";
import ContentForm from "../ContentForm";
import { updateContentAction, transitionContentAction, deleteContentAction } from "../actions";
import ContentStatusBar from "../../../../components/ContentStatusBar";

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
  const nextStatuses = CONTENT_STATUSES.filter((status) => canTransitionContent(content.status, status));

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{content.title}</h1>

      <ContentStatusBar
        status={content.status}
        nextStatuses={nextStatuses}
        transitionAction={transitionContentAction.bind(null, id)}
        deleteAction={deleteContentAction.bind(null, id)}
      />

      <ContentForm action={boundUpdate} initial={content} submitLabel="Kaydet" />
    </div>
  );
}
