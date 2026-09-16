/**
 * Core RBAC's only real decision point (ARCHITECTURE.md madde 9). Deliberately
 * a plain set-membership check on the permission strings baked into the
 * access token — no wildcarding, no role-name special-casing. A role that
 * should have everything (e.g. SUPER_ADMIN) gets every permission key
 * assigned explicitly at seed time instead of this function knowing about it.
 */
export function hasPermission(userPermissions: readonly string[], required: string): boolean {
  return userPermissions.includes(required);
}

export function hasAnyPermission(userPermissions: readonly string[], required: readonly string[]): boolean {
  return required.some((permission) => userPermissions.includes(permission));
}

export function hasAllPermissions(userPermissions: readonly string[], required: readonly string[]): boolean {
  return required.every((permission) => userPermissions.includes(permission));
}
