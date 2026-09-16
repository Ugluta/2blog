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
  { key: "CONTENT_VIEW", label: "İçerikleri görüntüle (taslaklar dahil)" },
  { key: "CONTENT_CREATE", label: "İçerik oluştur" },
  { key: "CONTENT_EDIT", label: "İçerik düzenle, kategori/etiket yönet" },
  { key: "CONTENT_DELETE", label: "İçerik sil" },
  { key: "CONTENT_PUBLISH", label: "İçeriği yayınla" },
] as const;

export type CorePermissionKey = (typeof CORE_PERMISSIONS)[number]["key"];
