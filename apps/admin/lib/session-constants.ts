/**
 * No "server-only" or "next/headers" import here on purpose — middleware.ts
 * runs in the Edge runtime with its own cookie API and can't use
 * next/headers's `cookies()`, but it still needs these same names/TTLs to
 * stay in sync with lib/session.ts (used by Server Actions/Components).
 */
export const ACCESS_TOKEN_COOKIE = "access_token";
export const REFRESH_TOKEN_COOKIE = "refresh_token";

/** Mirrors the API's default JWT_ACCESS_TTL/JWT_REFRESH_TTL (.env.example: 15m/30d). */
export const ACCESS_TOKEN_MAX_AGE = 15 * 60;
export const REFRESH_TOKEN_MAX_AGE = 30 * 24 * 60 * 60;
