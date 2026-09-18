import { notFound } from "next/navigation";
import { CONTENT_STATUSES, type Tool } from "@2blog/types";
import { canTransitionContent } from "@2blog/core-content-engine";
import { apiFetch, ApiError } from "../../../../lib/api";
import ToolForm from "../ToolForm";
import { updateToolAction, transitionToolAction, deleteToolAction } from "../actions";
import ContentStatusBar from "../../../../components/ContentStatusBar";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditToolPage({ params }: Props) {
  const { id } = await params;

  let tool: Tool;
  try {
    tool = await apiFetch<Tool>(`/tools/${id}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const nextStatuses = CONTENT_STATUSES.filter((status) => canTransitionContent(tool.status, status));

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{tool.title}</h1>

      <ContentStatusBar
        status={tool.status}
        nextStatuses={nextStatuses}
        transitionAction={transitionToolAction.bind(null, id)}
        deleteAction={deleteToolAction.bind(null, id)}
      />

      <ToolForm action={updateToolAction.bind(null, id)} initial={tool} submitLabel="Kaydet" />
    </div>
  );
}
