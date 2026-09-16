import { notFound } from "next/navigation";
import { CONTENT_STATUSES, type Project } from "@2blog/types";
import { canTransitionContent } from "@2blog/core-content-engine";
import { apiFetch, ApiError } from "../../../../lib/api";
import ProjectForm from "../ProjectForm";
import { updateProjectAction, transitionProjectAction, deleteProjectAction } from "../actions";
import ContentStatusBar from "../../../../components/ContentStatusBar";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditProjectPage({ params }: Props) {
  const { id } = await params;

  let project: Project;
  try {
    project = await apiFetch<Project>(`/projects/${id}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const nextStatuses = CONTENT_STATUSES.filter((status) => canTransitionContent(project.status, status));

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{project.title}</h1>

      <ContentStatusBar
        status={project.status}
        nextStatuses={nextStatuses}
        transitionAction={transitionProjectAction.bind(null, id)}
        deleteAction={deleteProjectAction.bind(null, id)}
      />

      <ProjectForm action={updateProjectAction.bind(null, id)} initial={project} submitLabel="Kaydet" />
    </div>
  );
}
