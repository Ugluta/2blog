import { Inject, Injectable } from "@nestjs/common";
import { and, eq, gt, inArray, isNull } from "drizzle-orm";
import { schema, type Database } from "@2blog/core-database";
import type { AuthenticatedUser, CursorPage, CursorPageQuery, User } from "@2blog/types";
import { DATABASE_CONNECTION } from "../database/database.constants";

@Injectable()
export class UsersService {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  async findByEmailWithPassword(email: string) {
    const rows = await this.db
      .select()
      .from(schema.users)
      .where(and(eq(schema.users.email, email), isNull(schema.users.deletedAt)))
      .limit(1);
    return rows[0] ?? null;
  }

  async getAuthenticatedUser(userId: string): Promise<AuthenticatedUser | null> {
    const userRows = await this.db
      .select()
      .from(schema.users)
      .where(and(eq(schema.users.id, userId), isNull(schema.users.deletedAt)))
      .limit(1);
    const user = userRows[0];
    if (!user) return null;

    const roleRows = await this.db
      .select({ id: schema.roles.id, key: schema.roles.key, label: schema.roles.label })
      .from(schema.userRoles)
      .innerJoin(schema.roles, eq(schema.userRoles.roleId, schema.roles.id))
      .where(eq(schema.userRoles.userId, userId));

    const roleIds = roleRows.map((role) => role.id);
    const permissionRows = roleIds.length
      ? await this.db
          .select({ key: schema.permissions.key })
          .from(schema.rolePermissions)
          .innerJoin(schema.permissions, eq(schema.rolePermissions.permissionId, schema.permissions.id))
          .where(inArray(schema.rolePermissions.roleId, roleIds))
      : [];

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      roles: roleRows,
      permissions: [...new Set(permissionRows.map((row) => row.key))],
    };
  }

  /** Keyset pagination on `id` — stable and duplicate/skip-free; not chronological (uuid is unordered). */
  async listUsers(query: CursorPageQuery): Promise<CursorPage<User>> {
    const limit = query.limit ?? 20;
    const rows = await this.db
      .select()
      .from(schema.users)
      .where(
        query.cursor
          ? and(isNull(schema.users.deletedAt), gt(schema.users.id, query.cursor))
          : isNull(schema.users.deletedAt),
      )
      .orderBy(schema.users.id)
      .limit(limit + 1);

    const page = rows.slice(0, limit);
    const nextCursor = rows.length > limit ? page[page.length - 1]!.id : null;

    return {
      items: page.map((user) => ({
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      })),
      nextCursor,
    };
  }

  async assignRole(userId: string, roleId: string): Promise<void> {
    await this.db.insert(schema.userRoles).values({ userId, roleId }).onConflictDoNothing();
  }
}
