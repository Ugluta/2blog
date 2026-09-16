import { notFound } from "next/navigation";
import { CONTENT_STATUSES, type Work } from "@2blog/types";
import { canTransitionContent } from "@2blog/core-content-engine";
import { apiFetch, ApiError } from "../../../../lib/api";
import WorkForm from "../WorkForm";
import { updateWorkAction, transitionWorkAction, deleteWorkAction } from "../actions";
import ContentStatusBar from "../../../../components/ContentStatusBar";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditWorkPage({ params }: Props) {
  const { id } = await params;

  let work: Work;
  try {
    work = await apiFetch<Work>(`/works/${id}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const nextStatuses = CONTENT_STATUSES.filter((status) => canTransitionContent(work.status, status));

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{work.title}</h1>

      <ContentStatusBar
        status={work.status}
        nextStatuses={nextStatuses}
        transitionAction={transitionWorkAction.bind(null, id)}
        deleteAction={deleteWorkAction.bind(null, id)}
      />

      <WorkForm action={updateWorkAction.bind(null, id)} initial={work} submitLabel="Kaydet" />
    </div>
  );
}
