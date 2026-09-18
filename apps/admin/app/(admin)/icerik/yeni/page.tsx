import type { Category } from "@2blog/types";
import { apiFetch } from "../../../../lib/api";
import ContentForm from "../ContentForm";
import { createPostAction } from "../actions";

export default async function NewContentPage() {
  const categories = await apiFetch<Category[]>("/categories");

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Yeni içerik</h1>
      <ContentForm action={createPostAction} categories={categories} submitLabel="Oluştur" />
    </div>
  );
}
