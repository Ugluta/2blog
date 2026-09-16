import type { GeneralSettings, SeoSettings, SocialSettings } from "@2blog/types";
import { apiFetch } from "../../../lib/api";
import { GeneralSettingsForm, SeoSettingsForm, SocialSettingsForm } from "./SettingsForms";

export default async function SettingsPage() {
  const all = await apiFetch<Record<string, Record<string, unknown>>>("/settings");
  const general = (all.general ?? {}) as Partial<GeneralSettings>;
  const seo = (all.seo ?? {}) as Partial<SeoSettings>;
  const social = (all.social ?? {}) as Partial<SocialSettings>;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Ayarlar</h1>
      <div className="flex flex-col gap-6">
        <GeneralSettingsForm initial={general} />
        <SeoSettingsForm initial={seo} />
        <SocialSettingsForm initial={social} />
      </div>
    </div>
  );
}
