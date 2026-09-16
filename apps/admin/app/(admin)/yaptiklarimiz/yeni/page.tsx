import WorkForm from "../WorkForm";
import { createWorkAction } from "../actions";

export default function NewWorkPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Yeni iş</h1>
      <WorkForm action={createWorkAction} submitLabel="Oluştur" />
    </div>
  );
}
