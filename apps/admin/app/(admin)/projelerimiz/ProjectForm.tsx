"use client";

import { useActionState } from "react";
import type { Project } from "@2blog/types";
import { PROJECT_STATUSES } from "@2blog/types";
import type { ProjectFormState } from "./actions";
import ContentBaseFields from "../../../components/ContentBaseFields";

interface Props {
  action: (state: ProjectFormState, formData: FormData) => Promise<ProjectFormState>;
  initial?: Project;
  submitLabel: string;
}

const PROJECT_STATUS_LABELS: Record<string, string> = {
  CONCEPT: "Konsept",
  PLANNING: "Planlama",
  DEVELOPMENT: "Geliştirme",
  COMPLETED: "Tamamlandı",
  MAINTENANCE: "Bakım",
  ARCHIVED: "Arşivde",
};

const initialState: ProjectFormState = {};

export default function ProjectForm({ action, initial, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const fieldError = (name: string) => state.fieldErrors?.[name]?.[0];

  return (
    <form action={formAction} className="max-w-2xl space-y-5">
      <ContentBaseFields initial={initial} fieldError={fieldError} />

      <div>
        <label htmlFor="problem">Problem</label>
        <textarea id="problem" name="problem" defaultValue={initial?.problem ?? undefined} rows={3} className="w-full" />
      </div>

      <div>
        <label htmlFor="solution">Çözüm</label>
        <textarea id="solution" name="solution" defaultValue={initial?.solution ?? undefined} rows={3} className="w-full" />
      </div>

      <div>
        <label htmlFor="technologies">Teknolojiler (virgülle ayırın)</label>
        <input id="technologies" name="technologies" defaultValue={initial?.technologies.join(", ")} className="w-full" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="demoUrl">Demo URL</label>
          <input id="demoUrl" name="demoUrl" type="url" defaultValue={initial?.demoUrl ?? undefined} className="w-full" />
        </div>
        <div>
          <label htmlFor="repoUrl">Repo URL</label>
          <input id="repoUrl" name="repoUrl" type="url" defaultValue={initial?.repoUrl ?? undefined} className="w-full" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="clientName">Müşteri adı</label>
          <input id="clientName" name="clientName" defaultValue={initial?.clientName ?? undefined} className="w-full" />
        </div>
        <div>
          <label htmlFor="projectStatus">Proje durumu</label>
          <select id="projectStatus" name="projectStatus" defaultValue={initial?.projectStatus ?? "CONCEPT"} className="w-full">
            {PROJECT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {PROJECT_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="startDate">Başlangıç tarihi</label>
          <input id="startDate" name="startDate" type="date" defaultValue={initial?.startDate ?? undefined} className="w-full" />
        </div>
        <div>
          <label htmlFor="endDate">Bitiş tarihi</label>
          <input id="endDate" name="endDate" type="date" defaultValue={initial?.endDate ?? undefined} className="w-full" />
        </div>
      </div>

      <div>
        <label htmlFor="results">Sonuçlar</label>
        <textarea id="results" name="results" defaultValue={initial?.results ?? undefined} rows={3} className="w-full" />
      </div>

      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}

      <button type="submit" disabled={pending} className="rounded-md bg-primary px-5 py-2.5 font-medium text-background disabled:opacity-50">
        {pending ? "Kaydediliyor…" : submitLabel}
      </button>
    </form>
  );
}
