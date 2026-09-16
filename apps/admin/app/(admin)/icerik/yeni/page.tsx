import ContentForm from "../ContentForm";
import { createPostAction } from "../actions";

export default function NewContentPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Yeni içerik</h1>
      <ContentForm action={createPostAction} submitLabel="Oluştur" />
    </div>
  );
}
