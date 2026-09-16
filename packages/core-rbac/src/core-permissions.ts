/**
 * Permission keys owned by Core itself (user/role/permission management).
 * Domain modules (Blog's BLOG_PUBLISH, PROJECT_EDIT, ...) register their own
 * keys the same way when they're built — Core never hard-codes theirs.
 */
export const CORE_PERMISSIONS = [
  { key: "USER_VIEW", label: "Kullanıcıları görüntüle" },
  { key: "USER_MANAGE", label: "Kullanıcı rollerini yönet" },
  { key: "ROLE_VIEW", label: "Rolleri ve izinleri görüntüle" },
  { key: "ROLE_MANAGE", label: "Rol oluştur / izin ata" },
] as const;

export type CorePermissionKey = (typeof CORE_PERMISSIONS)[number]["key"];
