import "server-only";
import type { ApiErrorBody, ApiSuccess } from "@2blog/types";
import { getAccessToken } from "./session";

const API_URL = process.env.API_INTERNAL_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
  }
}

export class UnauthenticatedError extends Error {}

/**
 * Every admin data access goes through this — never a direct DB query
 * (ARCHITECTURE.md madde 2/3). `cache: "no-store"` is deliberate: this is
 * always per-user authenticated data, and Core's cache strategy (madde 17)
 * says user-specific data is never cached, shared or otherwise.
 */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getAccessToken();
  if (!token) throw new UnauthenticatedError("No access token");

  const res = await fetch(`${API_URL}/api/v1${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
  });

  if (res.status === 401) throw new UnauthenticatedError("Access token rejected");

  const body = (await res.json()) as ApiSuccess<T> | ApiErrorBody;
  if (!res.ok) {
    const errorBody = body as ApiErrorBody;
    throw new ApiError(res.status, errorBody.error?.message ?? "Request failed", errorBody.error?.details);
  }
  return (body as ApiSuccess<T>).data;
}

/** For multipart uploads, where the caller builds its own FormData body. */
export async function apiFetchForm<T>(path: string, formData: FormData): Promise<T> {
  const token = await getAccessToken();
  if (!token) throw new UnauthenticatedError("No access token");

  const res = await fetch(`${API_URL}/api/v1${path}`, {
    method: "POST",
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (res.status === 401) throw new UnauthenticatedError("Access token rejected");

  const body = (await res.json()) as ApiSuccess<T> | ApiErrorBody;
  if (!res.ok) {
    const errorBody = body as ApiErrorBody;
    throw new ApiError(res.status, errorBody.error?.message ?? "Request failed", errorBody.error?.details);
  }
  return (body as ApiSuccess<T>).data;
}
