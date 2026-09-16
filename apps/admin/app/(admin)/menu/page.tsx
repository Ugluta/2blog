import type { MenuItem } from "@2blog/types";
import { apiFetch } from "../../../lib/api";
import { updateMenuItemAction, deleteMenuItemAction } from "./actions";
import CreateMenuItemForm from "./CreateMenuItemForm";

export default async function MenuPage() {
  const items = await apiFetch<MenuItem[]>("/menu");

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Menü</h1>

      <CreateMenuItemForm />

      {items.length === 0 ? (
        <p className="text-sm text-foreground/60">Henüz menü öğesi yok.</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <form
              key={item.id}
              action={updateMenuItemAction.bind(null, item.id)}
              className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-background p-4"
            >
              <div>
                <label htmlFor={`label-${item.id}`}>Etiket</label>
                <input id={`label-${item.id}`} name="label" defaultValue={item.label} required className="w-40" />
              </div>
              <div>
                <label htmlFor={`url-${item.id}`}>URL</label>
                <input id={`url-${item.id}`} name="url" defaultValue={item.url} required className="w-56" />
              </div>
              <div>
                <label htmlFor={`position-${item.id}`}>Sıra</label>
                <input id={`position-${item.id}`} name="position" type="number" defaultValue={item.position} className="w-20" />
              </div>
              <label className="flex items-center gap-2 pb-2 text-sm font-normal">
                <input type="checkbox" name="isVisible" defaultChecked={item.isVisible} className="w-auto" />
                Görünür
              </label>
              <button type="submit" className="rounded-md border border-border px-3 py-2 text-xs hover:border-primary">
                Kaydet
              </button>
              <button type="submit" formAction={deleteMenuItemAction.bind(null, item.id)} className="text-xs text-danger hover:underline">
                Sil
              </button>
            </form>
          ))}
        </div>
      )}
    </div>
  );
}
