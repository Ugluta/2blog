import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { schema, type Database } from "@2blog/core-database";
import type { Permission, Role } from "@2blog/types";
import { DATABASE_CONNECTION } from "../database/database.constants";

@Injectable()
export class RolesService {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  async listRoles(): Promise<Role[]> {
    return this.db.select().from(schema.roles).orderBy(schema.roles.key);
  }

  async listPermissions(): Promise<Permission[]> {
    return this.db.select().from(schema.permissions).orderBy(schema.permissions.key);
  }

  async createRole(key: string, label: string): Promise<Role> {
    const existing = await this.db.select().from(schema.roles).where(eq(schema.roles.key, key)).limit(1);
    if (existing.length > 0) {
      throw new ConflictException(`Role "${key}" already exists`);
    }
    const [role] = await this.db.insert(schema.roles).values({ key, label }).returning();
    return role!;
  }

  async attachPermission(roleId: string, permissionKey: string): Promise<void> {
    const roleRows = await this.db.select().from(schema.roles).where(eq(schema.roles.id, roleId)).limit(1);
    if (!roleRows[0]) throw new NotFoundException("Role not found");

    const permissionRows = await this.db
      .select()
      .from(schema.permissions)
      .where(eq(schema.permissions.key, permissionKey))
      .limit(1);
    if (!permissionRows[0]) throw new NotFoundException(`Permission "${permissionKey}" not found`);

    await this.db
      .insert(schema.rolePermissions)
      .values({ roleId, permissionId: permissionRows[0].id })
      .onConflictDoNothing();
  }
}
