import { eq } from "drizzle-orm";
import { loadEnv, databaseEnvSchema } from "@2blog/config";
import { CORE_PERMISSIONS } from "@2blog/core-rbac";
import { hashPassword } from "@2blog/core-auth";
import { createDatabase } from "./client";
import * as schema from "./schema";

/**
 * Idempotent by design: safe to re-run on every deploy. Registers Core's
 * own permission keys, ensures a SUPER_ADMIN role has all of them, and —
 * only if SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD are set — bootstraps the
 * first admin user (there is no public /auth/register endpoint by design,
 * ARCHITECTURE.md madde 15).
 */
async function main() {
  const env = loadEnv(databaseEnvSchema);
  const db = createDatabase(env.DATABASE_URL);

  for (const permission of CORE_PERMISSIONS) {
    await db.insert(schema.permissions).values(permission).onConflictDoNothing({ target: schema.permissions.key });
  }

  let [role] = await db.select().from(schema.roles).where(eq(schema.roles.key, "SUPER_ADMIN")).limit(1);
  if (!role) {
    [role] = await db.insert(schema.roles).values({ key: "SUPER_ADMIN", label: "Süper Admin" }).returning();
    console.log("Created role SUPER_ADMIN");
  }

  const allPermissions = await db.select().from(schema.permissions);
  for (const permission of allPermissions) {
    await db
      .insert(schema.rolePermissions)
      .values({ roleId: role!.id, permissionId: permission.id })
      .onConflictDoNothing();
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;

  if (adminEmail && adminPassword) {
    const [existing] = await db.select().from(schema.users).where(eq(schema.users.email, adminEmail)).limit(1);

    let userId = existing?.id;
    if (!existing) {
      const passwordHash = await hashPassword(adminPassword);
      const [created] = await db
        .insert(schema.users)
        .values({ email: adminEmail, passwordHash, displayName: "Admin" })
        .returning();
      userId = created!.id;
      console.log(`Created admin user ${adminEmail}`);
    } else {
      console.log(`Admin user ${adminEmail} already exists`);
    }

    await db.insert(schema.userRoles).values({ userId: userId!, roleId: role!.id }).onConflictDoNothing();
  } else {
    console.log("SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set — skipping admin user bootstrap");
  }

  console.log("Seed complete");
  process.exit(0);
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
