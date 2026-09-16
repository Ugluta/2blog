import type { ServiceCategory } from "@2blog/types";
import { apiFetch } from "../../../../lib/api";
import ServiceForm from "../ServiceForm";
import { createServiceAction } from "../actions";

export default async function NewServicePage() {
  const categories = await apiFetch<ServiceCategory[]>("/service-categories");

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Yeni hizmet</h1>
      <ServiceForm action={createServiceAction} categories={categories} submitLabel="Oluştur" />
    </div>
  );
}
