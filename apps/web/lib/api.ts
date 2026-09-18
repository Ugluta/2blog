import type { ApiSuccess, Content, CursorPage, GeneralSettings, MenuItem, Project, SeoSettings, Service, SocialSettings, Tool, Work } from "@2blog/types";

const API_URL = process.env.API_INTERNAL_URL ?? "http://localhost:4000";

/**
 * Every call here hits one of apps/api's guard-free `/*​/public` routes
 * (ARCHITECTURE.md madde 2/3) — web never touches the database directly,
 * and never sees anything but PUBLISHED content. Failures degrade to
 * empty/null rather than throwing, since a slow or momentarily-down API
 * shouldn't 500 the whole page.
 */
async function apiGet<T>(path: string, revalidateSeconds: number): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}/api/v1${path}`, { next: { revalidate: revalidateSeconds } });
    if (!res.ok) return null;
    const body = (await res.json()) as ApiSuccess<T>;
    return body.data;
  } catch {
    return null;
  }
}

const emptyPage = <T>(): CursorPage<T> => ({ items: [], nextCursor: null });

export async function getMenu(): Promise<MenuItem[]> {
  return (await apiGet<MenuItem[]>("/menu/public", 300)) ?? [];
}

export async function getGeneralSettings(): Promise<GeneralSettings> {
  const settings = await apiGet<Record<string, unknown>>("/settings/general", 300);
  return { siteName: "2blog", ...settings } as GeneralSettings;
}

export async function getSocialSettings(): Promise<SocialSettings> {
  return (await apiGet<SocialSettings>("/settings/social", 300)) ?? {};
}

export async function getSeoSettings(): Promise<SeoSettings> {
  return (await apiGet<SeoSettings>("/settings/seo", 300)) ?? { robotsIndexable: true };
}

export async function getPosts(cursor?: string, limit = 20): Promise<CursorPage<Content>> {
  const params = new URLSearchParams({ typeKey: "post", limit: String(limit) });
  if (cursor) params.set("cursor", cursor);
  return (await apiGet<CursorPage<Content>>(`/content/public?${params}`, 60)) ?? emptyPage();
}

export async function getPostBySlug(slug: string): Promise<Content | null> {
  return apiGet<Content>(`/content/public/${encodeURIComponent(slug)}`, 60);
}

export async function getProjects(cursor?: string, limit = 20): Promise<CursorPage<Project>> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set("cursor", cursor);
  return (await apiGet<CursorPage<Project>>(`/projects/public?${params}`, 60)) ?? emptyPage();
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  return apiGet<Project>(`/projects/public/${encodeURIComponent(slug)}`, 60);
}

export async function getServices(cursor?: string, limit = 20): Promise<CursorPage<Service>> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set("cursor", cursor);
  return (await apiGet<CursorPage<Service>>(`/services/public?${params}`, 60)) ?? emptyPage();
}

export async function getServiceBySlug(slug: string): Promise<Service | null> {
  return apiGet<Service>(`/services/public/${encodeURIComponent(slug)}`, 60);
}

export async function getWorks(cursor?: string, limit = 20): Promise<CursorPage<Work>> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set("cursor", cursor);
  return (await apiGet<CursorPage<Work>>(`/works/public?${params}`, 60)) ?? emptyPage();
}

export async function getWorkBySlug(slug: string): Promise<Work | null> {
  return apiGet<Work>(`/works/public/${encodeURIComponent(slug)}`, 60);
}

export async function getTools(cursor?: string, limit = 20): Promise<CursorPage<Tool>> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set("cursor", cursor);
  return (await apiGet<CursorPage<Tool>>(`/tools/public?${params}`, 60)) ?? emptyPage();
}

export async function getToolBySlug(slug: string): Promise<Tool | null> {
  return apiGet<Tool>(`/tools/public/${encodeURIComponent(slug)}`, 60);
}
