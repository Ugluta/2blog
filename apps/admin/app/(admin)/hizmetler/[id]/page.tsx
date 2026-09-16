import { notFound } from "next/navigation";
import { CONTENT_STATUSES, type Service, type ServiceCategory } from "@2blog/types";
import { canTransitionContent } from "@2blog/core-content-engine";
import { apiFetch, ApiError } from "../../../../lib/api";
import ServiceForm from "../ServiceForm";
import { updateServiceAction, transitionServiceAction, deleteServiceAction } from "../actions";
import ContentStatusBar from "../../../../components/ContentStatusBar";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditServicePage({ params }: Props) {
  const { id } = await params;

  let service: Service;
  try {
    service = await apiFetch<Service>(`/services/${id}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
  const categories = await apiFetch<ServiceCategory[]>("/service-categories");

  const nextStatuses = CONTENT_STATUSES.filter((status) => canTransitionContent(service.status, status));

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{service.title}</h1>

      <ContentStatusBar
        status={service.status}
        nextStatuses={nextStatuses}
        transitionAction={transitionServiceAction.bind(null, id)}
        deleteAction={deleteServiceAction.bind(null, id)}
      />

      <ServiceForm action={updateServiceAction.bind(null, id)} initial={service} categories={categories} submitLabel="Kaydet" />
    </div>
  );
}
