import ToolForm from "../ToolForm";
import { createToolAction } from "../actions";

export default function NewToolPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Yeni araç</h1>
      <ToolForm action={createToolAction} submitLabel="Oluştur" />
    </div>
  );
}
