/**
 * Shared API response envelope (madde 15/20, ARCHITECTURE.md) — every NestJS
 * controller returns one of these two shapes, and web/admin/mobile all decode
 * against the same types instead of each client inventing its own.
 */

export interface ApiSuccess<T> {
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiErrorBody;

export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
}

export interface CursorPageQuery {
  cursor?: string;
  limit?: number;
}
