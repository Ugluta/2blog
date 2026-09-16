export const SETTINGS_CATEGORIES = ["general", "seo", "social"] as const;
export type SettingsCategory = (typeof SETTINGS_CATEGORIES)[number];

export interface GeneralSettings {
  siteName: string;
  siteDescription?: string;
  contactEmail?: string;
}

export interface SeoSettings {
  defaultMetaTitle?: string;
  defaultMetaDescription?: string;
  defaultOgImage?: string;
  robotsIndexable: boolean;
}

export interface SocialSettings {
  facebookUrl?: string;
  twitterUrl?: string;
  instagramUrl?: string;
  linkedinUrl?: string;
  youtubeUrl?: string;
}

export interface SettingsByCategory {
  general: GeneralSettings;
  seo: SeoSettings;
  social: SocialSettings;
}

export type AllSettings = { [K in SettingsCategory]: SettingsByCategory[K] };
