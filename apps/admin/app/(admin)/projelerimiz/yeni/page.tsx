import ProjectForm from "../ProjectForm";
import { createProjectAction } from "../actions";

export default function NewProjectPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Yeni proje</h1>
      <ProjectForm action={createProjectAction} submitLabel="Oluştur" />
    </div>
  );
}
