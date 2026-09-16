/**
 * Core RBAC identity shapes (ARCHITECTURE.md madde 9). Deliberately generic —
 * domain-specific profile attributes (e.g. Evrak's teacherLevel) live in each
 * domain's own types, never merged into these.
 */

export interface User {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: string;
  key: string;
  label: string;
}

export interface Permission {
  id: string;
  key: string;
  label: string;
}

export interface AuthenticatedUser extends User {
  roles: Role[];
  permissions: string[];
}

/**
 * Shape embedded in the access token (ARCHITECTURE.md madde 8) — kept
 * intentionally small; the token is short-lived so roles/permissions are
 * baked in at issuance rather than re-fetched from the DB per request.
 */
export interface AccessTokenPayload {
  sub: string;
  email: string;
  roles: string[];
  permissions: string[];
}
